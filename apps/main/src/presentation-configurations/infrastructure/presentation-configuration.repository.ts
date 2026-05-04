import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { PresentationReferenceTypeType } from "@open-dpp/dto";
import type { Model as MongooseModel } from "mongoose";
import { DbSessionOptions } from "../../database/query-options";
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
      .sort({ createdAt: 1, _id: 1 })
      .session(options?.session ?? null);
    if (!doc) {
      return undefined;
    }
    const plain = doc.toObject();
    return PresentationConfiguration.fromPlain({ ...plain, id: plain._id });
  }

  async countByReference(
    ref: PresentationConfigurationReference,
    options?: DbSessionOptions,
  ): Promise<number> {
    return await this.presentationConfigurationDoc
      .countDocuments({
        referenceType: ref.referenceType,
        referenceId: ref.referenceId,
      })
      .session(options?.session ?? null);
  }

  async findManyByReference(
    ref: PresentationConfigurationReference,
    options?: DbSessionOptions,
  ): Promise<PresentationConfiguration[]> {
    const docs = await this.presentationConfigurationDoc
      .find({
        referenceType: ref.referenceType,
        referenceId: ref.referenceId,
      })
      .sort({ createdAt: 1, _id: 1 })
      .session(options?.session ?? null);
    return docs.map((doc) => {
      const plain = doc.toObject();
      return PresentationConfiguration.fromPlain({ ...plain, id: plain._id });
    });
  }

  async deleteById(
    id: string,
    options?: DbSessionOptions,
  ): Promise<boolean> {
    const result = await this.presentationConfigurationDoc
      .deleteOne({ _id: id })
      .session(options?.session ?? null);
    return result.deletedCount === 1;
  }

  async deleteByReference(
    ref: PresentationConfigurationReference,
    options?: DbSessionOptions,
  ): Promise<void> {
    await this.presentationConfigurationDoc
      .deleteMany({
        referenceType: ref.referenceType,
        referenceId: ref.referenceId,
      })
      .session(options?.session ?? null);
  }
}
