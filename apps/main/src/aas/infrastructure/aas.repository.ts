import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { findOne, findOneOrFail, save } from "./repository-helpers";
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

  async save(assetAdminstrationShell: AssetAdministrationShell) {
    return await save(assetAdminstrationShell, this.aasDoc, AssetAdministrationShellDocSchemaVersion.v1_0_0, AssetAdministrationShell.fromPlain);
  }

  async findOneOrFail(id: string): Promise<AssetAdministrationShell> {
    return await findOneOrFail(id, this.aasDoc, AssetAdministrationShell.fromPlain);
  }

  async findOne(id: string): Promise<AssetAdministrationShell | undefined> {
    return await findOne(id, this.aasDoc, AssetAdministrationShell.fromPlain);
  }
}
