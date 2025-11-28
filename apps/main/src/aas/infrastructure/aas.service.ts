import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { DbVisitor } from "./db-visitor";
import { AssetAdministrationShellDoc } from "./schemas/asset-administration-shell.schema";
import { SubmodelDocSchemaVersion } from "./schemas/submodel.schema";

@Injectable()
export class AasService {
  private aasDoc: MongooseModel<AssetAdministrationShellDoc>;

  constructor(
    @InjectModel(AssetAdministrationShellDoc.name)
    aasDoc: MongooseModel<AssetAdministrationShellDoc>,
  ) {
    this.aasDoc = aasDoc;
  }

  convertToDomain(
    assetAdministrationShellDoc: AssetAdministrationShellDoc,
  ) {
    const plain = assetAdministrationShellDoc.toObject();
    return AssetAdministrationShell.fromPlain({ ...plain, id: plain._id });
  }

  async save(assetAdminstrationShell: AssetAdministrationShell) {
    // 1. Try to find an existing document
    let doc = await this.aasDoc.findById(assetAdminstrationShell.id);

    // 2. If none exists, create a new discriminator document
    if (!doc) {
      // eslint-disable-next-line new-cap
      doc = new this.aasDoc({
        _id: assetAdminstrationShell.id, // top-level discriminator
      });
    }
    const dbVisitor = new DbVisitor();
    const plainAas = assetAdminstrationShell.accept(dbVisitor);
    // 3. Modify fields — casting and validation occur on save()
    doc.set({
      _schemaVersion: SubmodelDocSchemaVersion.v1_0_0,
      ...plainAas,
    });
    return this.convertToDomain(await doc.save({ validateBeforeSave: true }));
  }

  async findOneOrFail(id: string): Promise<AssetAdministrationShell> {
    const aas = await this.findOne(id);
    if (!aas) {
      throw new NotFoundInDatabaseException(AssetAdministrationShell.name);
    }
    return aas;
  }

  async findOne(id: string): Promise<AssetAdministrationShell | undefined> {
    const aasDoc = await this.aasDoc.findById(id);
    if (!aasDoc) {
      return undefined;
    }
    return this.convertToDomain(
      aasDoc,
    );
  }
}
