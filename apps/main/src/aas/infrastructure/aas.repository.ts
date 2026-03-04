import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { match, P } from "ts-pattern";
import { DbSessionOptions } from "../../database/query-options";
import { findByIds, findOne, findOneOrFail, save } from "../../lib/repositories";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { AssetAdministrationShellDbSchema } from "./schemas/asset-administration-shell-db-schema";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellDocSchemaVersion,
} from "./schemas/asset-administration-shell.schema";

@Injectable()
export class AasRepository {
  private aasDoc: MongooseModel<AssetAdministrationShellDoc>;

  constructor(
    @InjectModel(AssetAdministrationShellDoc.name)
    aasDoc: MongooseModel<AssetAdministrationShellDoc>,
  ) {
    this.aasDoc = aasDoc;
  }

  fromPlain(plain: any): AssetAdministrationShell {
    return AssetAdministrationShell.fromPlain(AssetAdministrationShellDbSchema.encode(plain));
  }

  fromPlainWithMigration(plain: any): AssetAdministrationShell {
    return match(plain).with({
      _schemaVersion: AssetAdministrationShellDocSchemaVersion.v1_0_0,
      assetInformation: {
        defaultThumbnail: P.optional({
          path: P.string,
          contentType: P.union(P.string, null),
        }),
      },
    }, ({ assetInformation }) => {
      return this.fromPlain({
        ...plain,
        assetInformation: {
          ...assetInformation,
          defaultThumbnails: assetInformation.defaultThumbnail ? [assetInformation.defaultThumbnail] : [],
        },
      });
    }).otherwise(() => {
      return this.fromPlain(plain);
    });
  }

  async save(assetAdministrationShell: AssetAdministrationShell, options?: DbSessionOptions) {
    return await save(assetAdministrationShell, this.aasDoc, AssetAdministrationShellDocSchemaVersion.v1_1_0, this.fromPlain.bind(this), AssetAdministrationShellDbSchema, options);
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
}
