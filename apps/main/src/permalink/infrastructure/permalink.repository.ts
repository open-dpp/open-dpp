import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { PresentationReferenceType } from "@open-dpp/dto";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import type { Model as MongooseModel } from "mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { findOne, findOneOrFail, save } from "../../lib/repositories";
import { decodeCursor, encodeCursor, Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { PresentationConfigurationDoc } from "../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { UNIQUE_PRODUCT_IDENTIFIER_COLLECTION } from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { Permalink } from "../domain/permalink";
import { PermalinkDoc, PermalinkDocVersion } from "./permalink.schema";

@Injectable()
export class PermalinkRepository {
  private readonly permalinkDoc: MongooseModel<PermalinkDoc>;
  private readonly presentationConfigurationDoc: MongooseModel<PresentationConfigurationDoc>;

  constructor(
    @InjectModel(PermalinkDoc.name)
    permalinkDoc: MongooseModel<PermalinkDoc>,
    @InjectModel(PresentationConfigurationDoc.name)
    presentationConfigurationDoc: MongooseModel<PresentationConfigurationDoc>,
  ) {
    this.permalinkDoc = permalinkDoc;
    this.presentationConfigurationDoc = presentationConfigurationDoc;
  }

  /**
   * Pure per-doc migration from schema 1.2.0 to 1.3.0.
   *
   * NOTE: `primary` defaults to `false` here (NOT `true`) — a per-doc migration
   * cannot see sibling documents, so it must NOT unconditionally mint a primary.
   * Collection-aware normalization (D10) happens in `findAllByPassportId` /
   * `findPrimaryByPassportId` after all docs in a passport's set are loaded.
   */
  migrate1_2_0To1_3_0(plain: any): any {
    return {
      ...plain,
      primary: plain.primary ?? false,
      uniqueProductIdentifierId: plain.uniqueProductIdentifierId ?? null,
      gs1ResolverBase: plain.gs1ResolverBase ?? null,
      gs1DataAttributes: plain.gs1DataAttributes ?? null,
      _schemaVersion: PermalinkDocVersion.v1_3_0,
    };
  }

  async fromPlain(plain: any): Promise<Permalink> {
    return Permalink.fromPlain(plain);
  }

  async fromPlainWithMigration(plain: any): Promise<Permalink> {
    let migrated = plain;
    if (
      !migrated._schemaVersion ||
      migrated._schemaVersion <= PermalinkDocVersion.v1_2_0
    ) {
      migrated = this.migrate1_2_0To1_3_0(migrated);
    }
    return this.fromPlain(migrated);
  }

  async save(permalink: Permalink, options?: DbSessionOptions): Promise<Permalink> {
    return await save(
      permalink,
      this.permalinkDoc,
      PermalinkDocVersion.v1_3_0,
      this.fromPlain.bind(this),
      undefined,
      options,
    );
  }

  async findOne(id: string): Promise<Permalink | undefined> {
    return await findOne(id, this.permalinkDoc, this.fromPlainWithMigration.bind(this));
  }

  async findOneOrFail(id: string): Promise<Permalink> {
    return await findOneOrFail(id, this.permalinkDoc, this.fromPlainWithMigration.bind(this));
  }

  async findBySlug(slug: string, options?: DbSessionOptions): Promise<Permalink | undefined> {
    const doc = await this.permalinkDoc
      .findOne({ slug: { $eq: slug } })
      .session(options?.session ?? null);
    if (!doc) return undefined;
    const plain = doc.toObject();
    return this.fromPlainWithMigration({ ...plain, id: plain._id });
  }

  async findBySlugOrFail(slug: string, options?: DbSessionOptions): Promise<Permalink> {
    const permalink = await this.findBySlug(slug, options);
    if (!permalink) {
      throw new NotFoundInDatabaseException(PermalinkDoc.name);
    }
    return permalink;
  }

  async findByPresentationConfigurationId(
    presentationConfigurationId: string,
    options?: DbSessionOptions,
  ): Promise<Permalink | undefined> {
    const doc = await this.permalinkDoc
      .findOne({ presentationConfigurationId })
      .session(options?.session ?? null);
    if (!doc) return undefined;
    const plain = doc.toObject();
    return this.fromPlainWithMigration({ ...plain, id: plain._id });
  }

  private isLegacySchemaVersion(schemaVersion: string | undefined): boolean {
    if (!schemaVersion) return true;
    return schemaVersion <= PermalinkDocVersion.v1_2_0;
  }

  /**
   * Collection-aware single-primary normalization (D10).
   *
   * Applied ONLY to sets that contain at least one legacy document (schema ≤ 1.2.0),
   * because those docs lacked the `primary` field and therefore all arrive with
   * `primary:false` after per-doc migration — no single-primary invariant can be
   * inferred from the stored values alone.
   *
   * For fully-current sets (all docs at 1.3.0) the stored `primary` flags are
   * authoritative; this function is a no-op.
   *
   * Rules when normalization fires:
   * - Zero primaries → promote the earliest-`createdAt` presentation permalink
   *   (ties broken by `_id` ascending).
   * - More than one primary → keep only the earliest one as primary; demote the rest.
   *
   * This is read-time normalization: corrected flags are returned in the domain
   * objects but the underlying documents are NOT rewritten. A subsequent `save()` or
   * the eager backfill (Slice 25.1) persists the corrected flags.
   */
  private normalizePrimaryInSet(
    permalinks: Permalink[],
    hadLegacyDocs: boolean,
  ): Permalink[] {
    if (permalinks.length === 0) return [];

    const primaries = permalinks.filter((p) => p.primary);

    if (primaries.length === 1) {
      // Already correct — no change needed regardless of legacy presence
      return permalinks;
    }

    // Only apply D10 normalization if the set contained legacy docs
    if (!hadLegacyDocs) {
      return permalinks;
    }

    // Determine the canonical primary: earliest createdAt, ties broken by _id (both ASC)
    const sorted = [...permalinks].sort((a, b) => {
      const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    const canonicalId = sorted[0].id;

    return permalinks.map((p) => {
      const shouldBePrimary = p.id === canonicalId;
      if (p.primary === shouldBePrimary) return p;
      return p.withPrimary(shouldBePrimary);
    });
  }

  async findAllByPassportId(passportId: string, options?: DbSessionOptions): Promise<Permalink[]> {
    const results = await this.permalinkDoc
      .aggregate([
        {
          $lookup: {
            from: this.presentationConfigurationDoc.collection.name,
            localField: "presentationConfigurationId",
            foreignField: "_id",
            as: "config",
          },
        },
        {
          $match: {
            "config.referenceType": PresentationReferenceType.Passport,
            "config.referenceId": { $eq: passportId },
          },
        },
        { $sort: { createdAt: 1, _id: 1 } },
        { $project: { config: 0 } },
      ])
      .session(options?.session ?? null);

    const hadLegacyDocs = results.some((plain) =>
      this.isLegacySchemaVersion(plain._schemaVersion),
    );
    const migrated = await Promise.all(
      results.map((plain) => this.fromPlainWithMigration({ ...plain, id: plain._id })),
    );
    return this.normalizePrimaryInSet(migrated, hadLegacyDocs);
  }

  async findPrimaryByPassportId(
    passportId: string,
    options?: DbSessionOptions,
  ): Promise<Permalink | undefined> {
    // Load ALL presentation permalinks for the passport (migration + D10 normalization applied),
    // then return the one with primary:true. This ensures legacy docs with zero primaries are
    // correctly promoted rather than returning undefined for a passport that has valid permalinks.
    const all = await this.findAllByPassportId(passportId, options);
    return all.find((p) => p.primary);
  }

  async findGs1LinkByUpiId(
    upiUuid: string,
    options?: DbSessionOptions,
  ): Promise<Permalink | undefined> {
    const doc = await this.permalinkDoc
      .findOne({ uniqueProductIdentifierId: { $eq: upiUuid } })
      .session(options?.session ?? null);
    if (!doc) return undefined;
    const plain = doc.toObject();
    return this.fromPlainWithMigration({ ...plain, id: plain._id });
  }

  async findAllByOrganizationId(
    organizationId: string,
    options?: { pagination?: { limit?: number; cursor?: string } },
    dbOptions?: DbSessionOptions,
  ): Promise<PagingResult<Permalink>> {
    const pagination = Pagination.create({
      limit: options?.pagination?.limit ?? 100,
      cursor: options?.pagination?.cursor,
    });
    const cursorFilter =
      pagination.cursor
        ? {
            $or: [
              { createdAt: { $lt: decodeCursor(pagination.cursor).createdAt } },
              {
                createdAt: decodeCursor(pagination.cursor).createdAt,
                _id: { $lt: decodeCursor(pagination.cursor).id },
              },
            ],
          }
        : {};
    const docs = await this.permalinkDoc
      .find({ organizationId: { $eq: organizationId }, ...cursorFilter })
      .sort({ createdAt: -1, _id: -1 })
      .limit(pagination.limit ?? 100)
      .session(dbOptions?.session ?? null)
      .exec();
    const items = await Promise.all(
      docs.map((doc) => {
        const plain = doc.toObject();
        return this.fromPlainWithMigration({ ...plain, id: plain._id });
      }),
    );
    if (items.length > 0) {
      const last = items[items.length - 1];
      pagination.setCursor(encodeCursor(last.createdAt.toISOString(), last.id));
    }
    return PagingResult.create<Permalink>({ pagination, items });
  }

  /**
   * List ALL permalinks belonging to a single passport — the UNION of:
   *   - presentation permalinks (resolved via the presentation-configuration join:
   *     `presentationConfigurationId → config.referenceId === passportId`), and
   *   - gs1-link permalinks (resolved via the UPI join:
   *     `uniqueProductIdentifierId → upi.referenceId === passportId`).
   *
   * `findAllByPassportId` returns ONLY the presentation set; gs1-link permalinks
   * carry a null `presentationConfigurationId` and reference a UPI, so they are
   * invisible to that join. This method unions both kinds in a single aggregate so
   * the backoffice per-passport list shows every permalink for the passport.
   *
   * Newest-first with the same `createdAt + _id` cursor used by
   * `findAllByOrganizationId`. NOTE: because this is an aggregate (no Mongoose
   * schema casting), the cursor's `createdAt` must be wrapped in `new Date(...)`.
   * Unlike `findAllByPassportId` this does NOT apply D10 single-primary
   * normalization — a page cannot see the full set — matching the org-scoped list.
   */
  async findPageByPassportId(
    passportId: string,
    options?: { pagination?: { limit?: number; cursor?: string } },
    dbOptions?: DbSessionOptions,
  ): Promise<PagingResult<Permalink>> {
    const pagination = Pagination.create({
      limit: options?.pagination?.limit ?? 100,
      cursor: options?.pagination?.cursor,
    });
    const cursor = pagination.cursor ? decodeCursor(pagination.cursor) : null;
    const cursorMatch = cursor
      ? [
          {
            $or: [
              { createdAt: { $lt: new Date(cursor.createdAt) } },
              { createdAt: new Date(cursor.createdAt), _id: { $lt: cursor.id } },
            ],
          },
        ]
      : [];
    const results = await this.permalinkDoc
      .aggregate([
        {
          $lookup: {
            from: this.presentationConfigurationDoc.collection.name,
            localField: "presentationConfigurationId",
            foreignField: "_id",
            as: "config",
          },
        },
        {
          $lookup: {
            from: UNIQUE_PRODUCT_IDENTIFIER_COLLECTION,
            localField: "uniqueProductIdentifierId",
            foreignField: "_id",
            as: "upi",
          },
        },
        {
          $match: {
            $and: [
              {
                $or: [
                  {
                    "config.referenceType": PresentationReferenceType.Passport,
                    "config.referenceId": { $eq: passportId },
                  },
                  { "upi.referenceId": { $eq: passportId } },
                ],
              },
              ...cursorMatch,
            ],
          },
        },
        { $sort: { createdAt: -1, _id: -1 } },
        { $limit: pagination.limit ?? 100 },
        { $project: { config: 0, upi: 0 } },
      ])
      .session(dbOptions?.session ?? null);

    const items = await Promise.all(
      results.map((plain) => this.fromPlainWithMigration({ ...plain, id: plain._id })),
    );
    if (items.length > 0) {
      const last = items[items.length - 1];
      pagination.setCursor(encodeCursor(last.createdAt.toISOString(), last.id));
    }
    return PagingResult.create<Permalink>({ pagination, items });
  }

  async deleteById(id: string, options?: DbSessionOptions): Promise<void> {
    await this.permalinkDoc.findByIdAndDelete(id, options);
  }

  async deleteByPresentationConfigurationId(
    presentationConfigurationId: string,
    options?: DbSessionOptions,
  ): Promise<void> {
    await this.permalinkDoc
      .deleteOne({ presentationConfigurationId })
      .session(options?.session ?? null);
  }

  async deleteAllByPassportId(passportId: string, options?: DbSessionOptions): Promise<number> {
    const configDocs = await this.presentationConfigurationDoc
      .find({
        referenceType: PresentationReferenceType.Passport,
        referenceId: passportId,
      })
      .session(options?.session ?? null);
    const configIds = configDocs.map((doc) => doc._id);
    if (configIds.length === 0) return 0;
    const result = await this.permalinkDoc
      .deleteMany({ presentationConfigurationId: { $in: configIds } })
      .session(options?.session ?? null);
    return result.deletedCount ?? 0;
  }
}
