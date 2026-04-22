import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { PresentationReferenceTypeType } from "@open-dpp/dto";
import type { Model as MongooseModel } from "mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { isDuplicateKeyError } from "../../lib/mongo-errors";
import { findOne, findOneOrFail, save } from "../../lib/repositories";
import { PresentationConfiguration } from "../domain/presentation-configuration";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationDocVersion,
} from "./presentation-configuration.schema";

export interface PresentationConfigurationReference {
  referenceType: PresentationReferenceTypeType;
  referenceId: string;
}

@Injectable()
export class PresentationConfigurationRepository {
  private readonly logger = new Logger(PresentationConfigurationRepository.name);
  private readonly presentationConfigurationDoc: MongooseModel<PresentationConfigurationDoc>;

  constructor(
    @InjectModel(PresentationConfigurationDoc.name)
    presentationConfigurationDoc: MongooseModel<PresentationConfigurationDoc>,
  ) {
    this.presentationConfigurationDoc = presentationConfigurationDoc;
  }

  async fromPlain(plain: any) {
    return PresentationConfiguration.fromPlain(plain);
  }

  async save(
    config: PresentationConfiguration,
    options?: DbSessionOptions,
  ): Promise<PresentationConfiguration> {
    return await save(
      config,
      this.presentationConfigurationDoc,
      PresentationConfigurationDocVersion.v1_0_0,
      this.fromPlain.bind(this),
      undefined,
      options,
    );
  }

  async findOne(id: string): Promise<PresentationConfiguration | undefined> {
    return await findOne(id, this.presentationConfigurationDoc, this.fromPlain.bind(this));
  }

  async findOneOrFail(id: string): Promise<PresentationConfiguration> {
    return await findOneOrFail(id, this.presentationConfigurationDoc, this.fromPlain.bind(this));
  }

  async findByReference(
    ref: PresentationConfigurationReference,
    options?: DbSessionOptions,
  ): Promise<PresentationConfiguration | undefined> {
    const doc = await this.presentationConfigurationDoc
      .findOne({
        referenceType: ref.referenceType,
        referenceId: ref.referenceId,
      })
      .session(options?.session ?? null);
    if (!doc) {
      return undefined;
    }
    const plain = doc.toObject();
    return PresentationConfiguration.fromPlain({ ...plain, id: plain._id });
  }

  async deleteByReference(
    ref: PresentationConfigurationReference,
    options?: DbSessionOptions,
  ): Promise<void> {
    await this.presentationConfigurationDoc
      .deleteOne({
        referenceType: ref.referenceType,
        referenceId: ref.referenceId,
      })
      .session(options?.session ?? null);
  }

  async findOrCreateByReference(
    data: {
      referenceType: PresentationReferenceTypeType;
      referenceId: string;
      organizationId: string;
    },
    options?: DbSessionOptions,
  ): Promise<PresentationConfiguration> {
    const ref = {
      referenceType: data.referenceType,
      referenceId: data.referenceId,
    };
    const existing = await this.findByReference(ref, options);
    if (existing) {
      return existing;
    }

    const fresh = PresentationConfiguration.create({
      organizationId: data.organizationId,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
    });

    // Concurrent callers can both pass the findByReference check above and race to save.
    // The unique index on (referenceType, referenceId) serializes them: the loser sees
    // E11000 and re-reads the winner's record. Any non-duplicate error still surfaces.
    try {
      return await this.save(fresh, options);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        const retry = await this.findByReference(ref, options);
        if (retry) {
          this.logger.warn(
            `findOrCreateByReference: race on (${data.referenceType}, ${data.referenceId}) recovered via re-read`,
          );
          return retry;
        }
      }
      throw error;
    }
  }
}
