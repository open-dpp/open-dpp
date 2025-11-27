import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { Submodel } from "../domain/submodelBase/submodel";
import { DbVisitor } from "./db-visitor";
import { SubmodelDoc, SubmodelDocSchemaVersion } from "./schemas/submodelBase/submodel.schema";

@Injectable()
export class AasService {
  private submodelDoc: MongooseModel<SubmodelDoc>;

  constructor(
    @InjectModel(SubmodelDoc.name)
    submodelDoc: MongooseModel<SubmodelDoc>,
  ) {
    this.submodelDoc = submodelDoc;
  }

  convertToDomain(
    submodelDoc: SubmodelDoc,
  ) {
    const plain = submodelDoc.toObject();
    return Submodel.fromPlain({ ...plain, id: plain._id });
  }

  async saveSubmodel(submodel: Submodel) {
    // 1. Try to find an existing document
    let doc = await this.submodelDoc.findById(submodel.id);

    // 2. If none exists, create a new discriminator document
    if (!doc) {
      // eslint-disable-next-line new-cap
      doc = new this.submodelDoc({
        _id: submodel.id, // top-level discriminator
      });
    }
    const dbVisitor = new DbVisitor();
    const plainSubmodel = submodel.accept(dbVisitor);
    // 3. Modify fields — casting and validation occur on save()
    doc.set({
      _schemaVersion: SubmodelDocSchemaVersion.v1_0_0,
      ...plainSubmodel,
    });
    return this.convertToDomain(await doc.save({ validateBeforeSave: true }));
  }

  async findOneSubmodelOrFail(id: string): Promise<Submodel> {
    const submodel = await this.findOneSubmodel(id);
    if (!submodel) {
      throw new NotFoundInDatabaseException(Submodel.name);
    }
    return submodel;
  }

  async findOneSubmodel(id: string): Promise<Submodel | undefined> {
    const submodelDoc = await this.submodelDoc.findById(id);
    if (!submodelDoc) {
      return undefined;
    }
    return this.convertToDomain(
      submodelDoc,
    );
  }
}
