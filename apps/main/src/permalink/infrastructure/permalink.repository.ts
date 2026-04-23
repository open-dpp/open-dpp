import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { PresentationReferenceType } from "@open-dpp/dto";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import type { Model as MongooseModel } from "mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { isDuplicateKeyError } from "../../lib/mongo-errors";
import { findOne, findOneOrFail, save } from "../../lib/repositories";
import { PresentationConfigurationDoc } from "../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { Permalink } from "../domain/permalink";
import { PermalinkDoc, PermalinkDocVersion } from "./permalink.schema";

@Injectable()
export class PermalinkRepository {
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

  async findByPassportId(
    passportId: string,
    options?: DbSessionOptions,
  ): Promise<Permalink | undefined> {
    // Join through presentation_configurations to avoid pulling the
    // PresentationConfigurationRepository as a dependency (would create a cycle:
    // PermalinkModule imports PresentationConfigurationsModule; reverse would
    // force PresentationConfigurationsModule to know about PermalinkModule).
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
        { $limit: 1 },
        { $project: { config: 0 } },
      ])
      .session(options?.session ?? null);

    if (results.length === 0) return undefined;
    const plain = results[0];
    return Permalink.fromPlain({ ...plain, id: plain._id });
  }

  async deleteByPresentationConfigurationId(
    presentationConfigurationId: string,
    options?: DbSessionOptions,
  ): Promise<void> {
    await this.permalinkDoc
      .deleteOne({ presentationConfigurationId })
      .session(options?.session ?? null);
  }

  async findOrCreateByPresentationConfigurationId(
    data: { presentationConfigurationId: string; slug?: string | null },
    options?: DbSessionOptions,
  ): Promise<{ permalink: Permalink; created: boolean }> {
    // Capture up-front: MongoDB flips the session out of its transaction
    // synchronously on E11000, so checking inside the catch would return
    // false and we would re-enter the unsafe re-read path.
    const inTransaction = options?.session?.inTransaction() ?? false;

    const existing = await this.findByPresentationConfigurationId(
      data.presentationConfigurationId,
      options,
    );
    if (existing) return { permalink: existing, created: false };

    const fresh = Permalink.create({
      presentationConfigurationId: data.presentationConfigurationId,
      slug: data.slug ?? null,
    });

    // Concurrent callers can both pass the find check above and race to save.
    // The unique index on presentationConfigurationId serializes them: the
    // loser sees E11000 and re-reads the winner's record. Any non-duplicate
    // error still surfaces.
    try {
      const saved = await this.save(fresh, options);
      return { permalink: saved, created: true };
    } catch (error) {
      // Inside a transaction, MongoDB aborts on E11000 and any follow-up
      // read on the same session will fail. Surface the error so the caller
      // can retry the whole transaction at a higher level.
      if (inTransaction) throw error;

      if (isDuplicateKeyError(error)) {
        const retry = await this.findByPresentationConfigurationId(
          data.presentationConfigurationId,
        );
        if (retry) {
          this.logger.warn(
            `findOrCreateByPresentationConfigurationId: race on ${data.presentationConfigurationId} recovered via re-read`,
          );
          return { permalink: retry, created: false };
        }
      }
      throw error;
    }
  }
}
