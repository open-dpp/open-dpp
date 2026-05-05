import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { PresentationReferenceType } from "@open-dpp/dto";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import type { Model as MongooseModel } from "mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { findOne, findOneOrFail, save } from "../../lib/repositories";
import { PresentationConfigurationDoc } from "../../presentation-configurations/infrastructure/presentation-configuration.schema";
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

  async fromPlain(plain: any): Promise<Permalink> {
    return Permalink.fromPlain(plain);
  }

  async save(permalink: Permalink, options?: DbSessionOptions): Promise<Permalink> {
    return await save(
      permalink,
      this.permalinkDoc,
      PermalinkDocVersion.v1_0_0,
      this.fromPlain.bind(this),
      undefined,
      options,
    );
  }

  async update(permalink: Permalink, options?: DbSessionOptions): Promise<Permalink> {
    return await save(
      permalink,
      this.permalinkDoc,
      PermalinkDocVersion.v1_0_0,
      this.fromPlain.bind(this),
      undefined,
      options,
    );
  }

  async findOne(id: string): Promise<Permalink | undefined> {
    return await findOne(id, this.permalinkDoc, this.fromPlain.bind(this));
  }

  async findOneOrFail(id: string): Promise<Permalink> {
    return await findOneOrFail(id, this.permalinkDoc, this.fromPlain.bind(this));
  }

  async findBySlug(slug: string, options?: DbSessionOptions): Promise<Permalink | undefined> {
    const doc = await this.permalinkDoc
      .findOne({ slug: { $eq: slug } })
      .session(options?.session ?? null);
    if (!doc) return undefined;
    const plain = doc.toObject();
    return Permalink.fromPlain({ ...plain, id: plain._id });
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
    return Permalink.fromPlain({ ...plain, id: plain._id });
  }

  async findAllByPassportId(passportId: string, options?: DbSessionOptions): Promise<Permalink[]> {
    // Join through presentation_configurations to avoid pulling the
    // PresentationConfigurationRepository as a dependency (would create a cycle:
    // PermalinkModule imports PresentationConfigurationsModule; reverse would
    // force PresentationConfigurationsModule to know about PermalinkModule).
    // Sorted by createdAt so the first element is the canonical default
    // permalink for the passport (mirrors PresentationConfigurationRepository.findByReference).
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
            "config.referenceId": passportId,
          },
        },
        { $sort: { createdAt: 1, _id: 1 } },
        { $project: { config: 0 } },
      ])
      .session(options?.session ?? null);

    return results.map((plain) => Permalink.fromPlain({ ...plain, id: plain._id }));
  }

  async deleteByPresentationConfigurationId(
    presentationConfigurationId: string,
    options?: DbSessionOptions,
  ): Promise<void> {
    await this.permalinkDoc
      .deleteOne({ presentationConfigurationId })
      .session(options?.session ?? null);
  }

  // Cascade-delete all permalinks for a passport — used during passport
  // deletion so multi-config passports do not leave orphan permalinks.
  // Resolves config ids first (within the same session) so the actual delete
  // is a simple multi-id match.
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
