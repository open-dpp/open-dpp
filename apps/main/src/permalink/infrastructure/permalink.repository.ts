import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DigitalProductDocumentTypes, LEGACY_PERMALINK_KIND, PermalinkKind } from "@open-dpp/dto";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import type { Model as MongooseModel } from "mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { findOne, findOneOrFail, findPageByCursor, save } from "../../lib/repositories";
import { decodeCursor, encodeCursor, Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { PASSPORT_COLLECTION } from "../../passports/infrastructure/passport.schema";
import { PresentationConfigurationDoc } from "../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { UNIQUE_PRODUCT_IDENTIFIER_COLLECTION } from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { Permalink } from "../domain/permalink";
import { PermalinkDoc, PermalinkDocVersion } from "./permalink.schema";

/** The three ways a permalink row can belong to a passport: its own passportId
 * (v1.4.0+), a legacy presentation-config join, or a legacy UPI join. */
function passportUnionMatch(passportId: string) {
  return {
    $or: [
      { passportId: { $eq: passportId } },
      {
        "config.referenceType": DigitalProductDocumentTypes.Passport,
        "config.referenceId": { $eq: passportId },
      },
      { "upi.referenceId": { $eq: passportId } },
    ],
  };
}

@Injectable()
export class PermalinkRepository implements OnApplicationBootstrap {
  private readonly logger = new Logger(PermalinkRepository.name);
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
   * Reconcile the collection's indexes with the schema definitions. Mongoose
   * never updates an EXISTING index whose options changed, so stale unique
   * indexes (the retired config-unique index, the pre-kind-scoped UPI index)
   * survive forever and reject valid inserts with a misleading E11000.
   * ponytail: syncIndexes also drops manually-added indexes on this collection.
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.backfillPermalinkKind();
    await this.permalinkDoc.syncIndexes();
    await this.backfillOrganizationIds();
  }

  /**
   * One-shot backfill: rows written before `kind` existed carry no such field
   * and fall outside every kind-scoped partial index and query. They all
   * predate gs1-links, so their end-state kind is "open-dpp" — stamped
   * directly, skipping the legacy "presentation" value. Runs BEFORE
   * `syncIndexes`; idempotent (the match set is empty after the first run).
   * Rows already stamped with the legacy "presentation" value are NOT
   * rewritten — the on-read migration maps them.
   */
  private async backfillPermalinkKind(): Promise<void> {
    const result = await this.permalinkDoc.updateMany(
      { kind: { $exists: false } },
      { $set: { kind: PermalinkKind.OPEN_DPP } },
    );
    if (result.modifiedCount > 0) {
      this.logger.log(`Backfilled kind on ${result.modifiedCount} permalink(s)`);
    }
  }

  /**
   * One-shot backfill: rows written before `organizationId` existed carry null,
   * which 403s the owning org on every /permalinks mutating route and hides the
   * row from the org-scoped list. Resolve config → passport → organizationId
   * once at bootstrap; idempotent (the match set is empty after the first run).
   * `kind: {$ne: gs1-link}` keeps a gs1-link row bound to a foreign
   * presentation config from inheriting that config's org.
   */
  private async backfillOrganizationIds(): Promise<void> {
    const rows: { _id: string; organizationId: string }[] = await this.permalinkDoc.aggregate([
      {
        $match: {
          organizationId: null,
          kind: { $ne: PermalinkKind.GS1_LINK },
          presentationConfigurationId: { $ne: null },
        },
      },
      {
        $lookup: {
          from: this.presentationConfigurationDoc.collection.name,
          localField: "presentationConfigurationId",
          foreignField: "_id",
          as: "config",
        },
      },
      { $unwind: "$config" },
      {
        $lookup: {
          from: PASSPORT_COLLECTION,
          localField: "config.referenceId",
          foreignField: "_id",
          as: "passport",
        },
      },
      { $unwind: "$passport" },
      { $project: { organizationId: "$passport.organizationId" } },
    ]);
    if (rows.length === 0) return;
    await this.permalinkDoc.bulkWrite(
      rows.map((row) => ({
        updateOne: {
          filter: { _id: row._id },
          update: { $set: { organizationId: row.organizationId } },
        },
      })),
    );
    this.logger.log(`Backfilled organizationId on ${rows.length} permalink(s)`);
  }

  /** Pure per-doc migration from schema 1.2.0 to 1.3.0. */
  migrate1_2_0To1_3_0(plain: any): any {
    return {
      ...plain,
      uniqueProductIdentifierId: plain.uniqueProductIdentifierId ?? null,
      gs1DataAttributes: plain.gs1DataAttributes ?? null,
      _schemaVersion: PermalinkDocVersion.v1_3_0,
    };
  }

  /**
   * Pure per-doc migration from schema 1.3.0 to 1.4.0: the legacy
   * "presentation" kind becomes "open-dpp" and the retired `primary` flag is
   * dropped. `passportId` is resolved separately (it needs a DB lookup for
   * legacy docs — see `resolveLegacyPassportId`).
   */
  migrate1_3_0To1_4_0(plain: any): any {
    const { primary: _primary, ...rest } = plain;
    return {
      ...rest,
      kind:
        !plain.kind || plain.kind === LEGACY_PERMALINK_KIND ? PermalinkKind.OPEN_DPP : plain.kind,
      _schemaVersion: PermalinkDocVersion.v1_4_0,
    };
  }

  /**
   * Legacy docs (< 1.4.0) carry no passportId; derive it from the refs they do
   * carry: presentation-config → referenceId, else UPI → referenceId. A doc
   * whose refs all dangle is unreadable data corruption — surfaced as a
   * NotFound rather than silently hydrating an unresolvable permalink.
   */
  private async resolveLegacyPassportId(plain: {
    presentationConfigurationId?: string | null;
    uniqueProductIdentifierId?: string | null;
  }): Promise<string> {
    if (plain.presentationConfigurationId) {
      const config = await this.presentationConfigurationDoc
        .findOne({ _id: { $eq: plain.presentationConfigurationId } })
        .lean();
      if (config?.referenceType === DigitalProductDocumentTypes.Passport) {
        return config.referenceId;
      }
    }
    if (plain.uniqueProductIdentifierId) {
      const upi = await this.permalinkDoc.db
        .collection(UNIQUE_PRODUCT_IDENTIFIER_COLLECTION)
        .findOne({ _id: plain.uniqueProductIdentifierId as any });
      if (typeof upi?.referenceId === "string") {
        return upi.referenceId;
      }
    }
    throw new NotFoundInDatabaseException(PermalinkDoc.name);
  }

  async fromPlain(plain: any): Promise<Permalink> {
    return Permalink.fromPlain(plain);
  }

  async fromPlainWithMigration(plain: any): Promise<Permalink> {
    let migrated = plain;
    if (!migrated._schemaVersion || migrated._schemaVersion <= PermalinkDocVersion.v1_2_0) {
      migrated = this.migrate1_2_0To1_3_0(migrated);
    }
    if (migrated._schemaVersion <= PermalinkDocVersion.v1_3_0) {
      migrated = this.migrate1_3_0To1_4_0(migrated);
    }
    if (typeof migrated.passportId !== "string") {
      migrated = { ...migrated, passportId: await this.resolveLegacyPassportId(migrated) };
    }
    return this.fromPlain(migrated);
  }

  async save(permalink: Permalink, options?: DbSessionOptions): Promise<Permalink> {
    return await save(
      permalink,
      this.permalinkDoc,
      PermalinkDocVersion.v1_4_0,
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

  /** Any permalink bound to the config, whatever its kind. */
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

  /**
   * The open-dpp permalink bound to the config. A config may also back
   * gs1-links as a rendering override, so callers deciding whether the config's
   * own permalink still has to be minted must ignore those.
   * `$ne` matches documents with the legacy "presentation" value and documents
   * with no `kind` field, so legacy rows still count.
   */
  async findOpenDppByPresentationConfigurationId(
    presentationConfigurationId: string,
    options?: DbSessionOptions,
  ): Promise<Permalink | undefined> {
    const doc = await this.permalinkDoc
      .findOne({ presentationConfigurationId, kind: { $ne: PermalinkKind.GS1_LINK } })
      .session(options?.session ?? null);
    if (!doc) return undefined;
    const plain = doc.toObject();
    return this.fromPlainWithMigration({ ...plain, id: plain._id });
  }

  /**
   * Every permalink belonging to the passport, oldest first — the union of the
   * direct `passportId` match (v1.4.0+ rows) and the two legacy join paths
   * (config-bound and UPI-bound rows written before the field existed).
   */
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
          $lookup: {
            from: UNIQUE_PRODUCT_IDENTIFIER_COLLECTION,
            localField: "uniqueProductIdentifierId",
            foreignField: "_id",
            as: "upi",
          },
        },
        { $match: passportUnionMatch(passportId) },
        { $sort: { createdAt: 1, _id: 1 } },
        { $project: { config: 0, upi: 0 } },
      ])
      .session(options?.session ?? null);

    return Promise.all(
      results.map((plain) => this.fromPlainWithMigration({ ...plain, id: plain._id })),
    );
  }

  async findGs1LinkByUpiId(
    upiUuid: string,
    options?: DbSessionOptions,
  ): Promise<Permalink | undefined> {
    const doc = await this.permalinkDoc
      .findOne({ uniqueProductIdentifierId: { $eq: upiUuid }, kind: PermalinkKind.GS1_LINK })
      .session(options?.session ?? null);
    if (!doc) return undefined;
    const plain = doc.toObject();
    return this.fromPlainWithMigration({ ...plain, id: plain._id });
  }

  /**
   * Batch-load the gs1-link permalinks referencing the given UPI uuids,
   * keyed by `uniqueProductIdentifierId`. At most one entry per UPI
   * (kind-scoped partial unique index). Open-dpp permalinks bound to a UPI
   * never match.
   */
  async findGs1LinksByUpiIds(
    upiUuids: string[],
    options?: DbSessionOptions,
  ): Promise<Map<string, Permalink>> {
    if (upiUuids.length === 0) return new Map();
    const docs = await this.permalinkDoc
      .find({ uniqueProductIdentifierId: { $in: upiUuids }, kind: PermalinkKind.GS1_LINK })
      .session(options?.session ?? null);
    const entries = await Promise.all(
      docs.map(async (doc): Promise<[string, Permalink]> => {
        const plain = doc.toObject();
        const permalink = await this.fromPlainWithMigration({ ...plain, id: plain._id });
        return [plain.uniqueProductIdentifierId as string, permalink];
      }),
    );
    return new Map(entries);
  }

  /**
   * Batch-load the LATEST permalink (any kind) referencing each of the given
   * UPI uuids, keyed by `uniqueProductIdentifierId`. Open-dpp UPIs may carry
   * several permalinks; the newest-created one is the row's "current link"
   * (same convention as the passport editor's QR button).
   */
  async findLatestPermalinksByUpiIds(
    upiUuids: string[],
    options?: DbSessionOptions,
  ): Promise<Map<string, Permalink>> {
    if (upiUuids.length === 0) return new Map();
    const docs = await this.permalinkDoc
      .find({ uniqueProductIdentifierId: { $in: upiUuids } })
      .sort({ createdAt: -1, _id: -1 })
      .session(options?.session ?? null);
    const result = new Map<string, Permalink>();
    for (const doc of docs) {
      const plain = doc.toObject();
      const upiId = plain.uniqueProductIdentifierId as string;
      if (result.has(upiId)) continue;
      result.set(upiId, await this.fromPlainWithMigration({ ...plain, id: plain._id }));
    }
    return result;
  }

  /**
   * Delete every permalink referencing one of the given UPI uuids (cascade for
   * passport deletion — config-bound and direct-passportId permalinks are
   * handled by `deleteAllByPassportId`).
   */
  async deleteGs1LinksByUpiIds(upiUuids: string[], options?: DbSessionOptions): Promise<void> {
    if (upiUuids.length === 0) return;
    await this.permalinkDoc
      .deleteMany({ uniqueProductIdentifierId: { $in: upiUuids } })
      .session(options?.session ?? null);
  }

  async findAllByOrganizationId(
    organizationId: string,
    options?: { pagination?: { limit?: number; cursor?: string } },
    dbOptions?: DbSessionOptions,
  ): Promise<PagingResult<Permalink>> {
    return findPageByCursor(
      this.permalinkDoc,
      { organizationId: { $eq: organizationId } },
      (doc) => {
        const plain = doc.toObject();
        return this.fromPlainWithMigration({ ...plain, id: plain._id });
      },
      {
        pagination: Pagination.create({
          limit: options?.pagination?.limit ?? 100,
          cursor: options?.pagination?.cursor,
        }),
        session: dbOptions?.session ?? null,
      },
    );
  }

  /**
   * List ALL permalinks belonging to a single passport, newest-first with the
   * same `createdAt + _id` cursor used by `findAllByOrganizationId`. Same
   * union as {@link findAllByPassportId}: direct passportId plus the two
   * legacy join paths.
   *
   * NOTE: because this is an aggregate (no Mongoose schema casting), the
   * cursor's `createdAt` must be wrapped in `new Date(...)`.
   *
   * The returned cursor is `null` on the last page — the documented contract
   * (`PagingMetadataDtoSchema`) consumers page against, mirroring
   * {@link findPageByCursor}. One extra doc is fetched purely to learn whether a
   * next page exists; it is dropped before migration.
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
    const limit = pagination.limit ?? 100;
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
    const fetched = await this.permalinkDoc
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
            $and: [passportUnionMatch(passportId), ...cursorMatch],
          },
        },
        { $sort: { createdAt: -1, _id: -1 } },
        { $limit: limit + 1 },
        { $project: { config: 0, upi: 0 } },
      ])
      .session(dbOptions?.session ?? null);

    const hasNextPage = fetched.length > limit;
    const results = hasNextPage ? fetched.slice(0, limit) : fetched;
    const items = await Promise.all(
      results.map((plain) => this.fromPlainWithMigration({ ...plain, id: plain._id })),
    );
    const last = items[items.length - 1];
    pagination.setCursor(
      hasNextPage && last ? encodeCursor(last.createdAt.toISOString(), last.id) : null,
    );
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

  /**
   * Cascade for passport deletion: removes rows matched directly by passportId
   * (v1.4.0+) and legacy rows matched via the passport's presentation configs.
   * Legacy UPI-bound gs1-links are covered by `deleteGs1LinksByUpiIds` in the
   * same flow.
   */
  async deleteAllByPassportId(passportId: string, options?: DbSessionOptions): Promise<number> {
    const configDocs = await this.presentationConfigurationDoc
      .find({
        referenceType: DigitalProductDocumentTypes.Passport,
        referenceId: passportId,
      })
      .session(options?.session ?? null);
    const configIds = configDocs.map((doc) => doc._id);
    const result = await this.permalinkDoc
      .deleteMany({
        $or: [
          { passportId: { $eq: passportId } },
          ...(configIds.length > 0 ? [{ presentationConfigurationId: { $in: configIds } }] : []),
        ],
      })
      .session(options?.session ?? null);
    return result.deletedCount ?? 0;
  }
}
