import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { findByIds, findOne, findOneOrFail, save } from "../../lib/repositories";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { Security } from "../domain/security/security";
import { AssetAdministrationShellDbSchema } from "./schemas/asset-administration-shell-db-schema";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellDocSchemaVersion,
} from "./schemas/asset-administration-shell.schema";
import { ReferenceDb } from "./schemas/db-types";
import { SecurityDb } from "./schemas/security/security-db-schema";
import { SubmodelRepository } from "./submodel.repository";

@Injectable()
export class AasRepository {
  private aasDoc: MongooseModel<AssetAdministrationShellDoc>;

  constructor(
    @InjectModel(AssetAdministrationShellDoc.name)
    aasDoc: MongooseModel<AssetAdministrationShellDoc>,
    private readonly submodelRepository: SubmodelRepository,
  ) {
    this.aasDoc = aasDoc;
  }

  async fromPlain(plain: any) {
    return AssetAdministrationShell.fromPlain(AssetAdministrationShellDbSchema.encode(plain));
  }

  migrate1_0_0To1_1_0(aas: { assetInformation: { defaultThumbnail: { path: string; contentType: string | null } } }) {
    return {
      ...aas,
      assetInformation: {
        ...aas.assetInformation,
        defaultThumbnails: aas.assetInformation.defaultThumbnail ? [aas.assetInformation.defaultThumbnail] : [],
      },
      _schemaVersion: AssetAdministrationShellDocSchemaVersion.v1_1_0,
    };
  }

  async migrate1_1_0To1_2_0(aas: { _id: string; submodels: ReferenceDb[]; security?: SecurityDb }) {
    if (aas.security !== undefined) {
      return {
        ...aas,
        _schemaVersion: AssetAdministrationShellDocSchemaVersion.v1_2_0,
      };
    }
    const security = Security.create({});

    for (const submodelReference of aas.submodels) {
      const submodel = await this.submodelRepository.findOneOrFail(submodelReference.keys[0].value);
      security.addDefaultPolicyForSubmodelIfNoExists(submodel);
    }

    return {
      ...aas,
      security: security.toPlain(),
    };
  }

  async fromPlainWithMigration(plain: any): Promise<AssetAdministrationShell> {
    let migratedVersion = plain;
    if (migratedVersion._schemaVersion === AssetAdministrationShellDocSchemaVersion.v1_0_0) {
      migratedVersion = this.migrate1_0_0To1_1_0(migratedVersion);
    }
    if (migratedVersion._schemaVersion === AssetAdministrationShellDocSchemaVersion.v1_1_0) {
      migratedVersion = await this.migrate1_1_0To1_2_0(migratedVersion);
    }
    return this.fromPlain(migratedVersion);
  }

  async save(assetAdministrationShell: AssetAdministrationShell, options?: DbSessionOptions) {
    return await save(assetAdministrationShell, this.aasDoc, AssetAdministrationShellDocSchemaVersion.v1_2_0, this.fromPlain.bind(this), AssetAdministrationShellDbSchema, options);
  }

  async findOneOrFail(id: string): Promise<AssetAdministrationShell> {
    return await findOneOrFail(id, this.aasDoc, this.fromPlainWithMigration.bind(this));
  }

  async findOne(id: string): Promise<AssetAdministrationShell | undefined> {
    return await findOne(id, this.aasDoc, this.fromPlainWithMigration.bind(this));
  }

  async findByIds(ids: string[]): Promise<Map<string, AssetAdministrationShell>> {
    return await findByIds(ids, this.aasDoc, this.fromPlainWithMigration.bind(this));
  }

  async deleteById(id: string, options?: DbSessionOptions): Promise<void> {
    await this.aasDoc.findByIdAndDelete(id, options);
  }
}
