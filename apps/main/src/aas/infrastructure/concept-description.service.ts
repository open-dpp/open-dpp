import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { ConceptDescription } from "../domain/concept-description";
import { DbVisitor } from "./db-visitor";
import { ConceptDescriptionDoc, ConceptDescriptionDocSchemaVersion } from "./schemas/concept-description.schema";

@Injectable()
export class ConceptDescriptionService {
  private conceptDescriptionDoc: MongooseModel<ConceptDescriptionDoc>;

  constructor(
    @InjectModel(ConceptDescriptionDoc.name)
    conceptDescriptionDoc: MongooseModel<ConceptDescriptionDoc>,
  ) {
    this.conceptDescriptionDoc = conceptDescriptionDoc;
  }

  convertToDomain(
    conceptDescriptionDoc: ConceptDescriptionDoc,
  ) {
    const plain = conceptDescriptionDoc.toObject();
    return ConceptDescription.fromPlain({ ...plain, id: plain._id });
  }

  async save(conceptDescription: ConceptDescription) {
    // 1. Try to find an existing document
    let doc = await this.conceptDescriptionDoc.findById(conceptDescription.id);

    // 2. If none exists, create a new discriminator document
    if (!doc) {
      // eslint-disable-next-line new-cap
      doc = new this.conceptDescriptionDoc({
        _id: conceptDescription.id, // top-level discriminator
      });
    }
    const dbVisitor = new DbVisitor();
    const plainConceptDescription = conceptDescription.accept(dbVisitor);
    // 3. Modify fields — casting and validation occur on save()
    doc.set({
      _schemaVersion: ConceptDescriptionDocSchemaVersion.v1_0_0,
      ...plainConceptDescription,
    });
    return this.convertToDomain(await doc.save({ validateBeforeSave: true }));
  }

  async findOneOrFail(id: string): Promise<ConceptDescription> {
    const conceptDescription = await this.findOne(id);
    if (!conceptDescription) {
      throw new NotFoundInDatabaseException(ConceptDescription.name);
    }
    return conceptDescription;
  }

  async findOne(id: string): Promise<ConceptDescription | undefined> {
    const conceptDescriptionDoc = await this.conceptDescriptionDoc.findById(id);
    if (!conceptDescriptionDoc) {
      return undefined;
    }
    return this.convertToDomain(
      conceptDescriptionDoc,
    );
  }
}
