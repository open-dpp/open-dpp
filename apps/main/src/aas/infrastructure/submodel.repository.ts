import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { findByIds, findOne, findOneOrFail, save } from "../../lib/repositories";
import { Submodel } from "../domain/submodel-base/submodel";
import { SubmodelDbSchema } from "./schemas/submodel-base/submodel-db-schema";
import { SubmodelDoc, SubmodelDocSchemaVersion } from "./schemas/submodel.schema";
import { migrateSubmodelLinks } from "./migrate-links";

@Injectable()
export class SubmodelRepository {
  private submodelDoc: MongooseModel<SubmodelDoc>;

  constructor(
    @InjectModel(SubmodelDoc.name)
    submodelDoc: MongooseModel<SubmodelDoc>,
  ) {
    this.submodelDoc = submodelDoc;
  }

  async fromPlain(plain: any) {
    return Submodel.fromPlain(SubmodelDbSchema.encode(plain));
  }

  migrate1_0_0To1_1_0(plain: any) {
    return {
      ...migrateSubmodelLinks(plain),
      _schemaVersion: SubmodelDocSchemaVersion.v1_1_0,
    };
  }

  async fromPlainWithMigration(plain: any): Promise<Submodel> {
    let migratedVersion = plain;
    if (
      !migratedVersion._schemaVersion ||
      migratedVersion._schemaVersion === SubmodelDocSchemaVersion.v1_0_0
    ) {
      migratedVersion = this.migrate1_0_0To1_1_0(migratedVersion);
    }
    return this.fromPlain(migratedVersion);
  }

  async save(submodel: Submodel, options?: DbSessionOptions) {
    return await save(
      submodel,
      this.submodelDoc,
      SubmodelDocSchemaVersion.v1_1_0,
      this.fromPlain,
      SubmodelDbSchema,
      options,
    );
  }

  async findOneOrFail(id: string): Promise<Submodel> {
    return await findOneOrFail(id, this.submodelDoc, this.fromPlainWithMigration.bind(this));
  }

  async deleteById(id: string, options?: DbSessionOptions): Promise<void> {
    await this.submodelDoc.findByIdAndDelete(id, options);
  }

  async findOne(id: string): Promise<Submodel | undefined> {
    return await findOne(id, this.submodelDoc, this.fromPlainWithMigration.bind(this));
  }

  async findByIds(ids: string[]): Promise<Map<string, Submodel>> {
    return await findByIds(ids, this.submodelDoc, this.fromPlainWithMigration.bind(this));
  }
}
