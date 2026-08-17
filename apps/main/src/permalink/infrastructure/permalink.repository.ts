import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DigitalProductDocumentTypes, PermalinkKind } from "@open-dpp/dto";
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

  async onApplicationBootstrap(): Promise<void> {
    await this.permalinkDoc.syncIndexes();
    await this.backfillOrganizationIds();
  }

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

  migrate1_2_0To1_3_0(plain: any): any {
    return {
      ...plain,
      uniqueProductIdentifierId: plain.uniqueProductIdentifierId ?? null,
      gs1DataAttributes: plain.gs1DataAttributes ?? null,
      _schemaVersion: PermalinkDocVersion.v1_3_0,
    };
  }

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
    if (typeof migrated.passportId !== "string") {
      migrated = { ...migrated, passportId: await this.resolveLegacyPassportId(migrated) };
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
