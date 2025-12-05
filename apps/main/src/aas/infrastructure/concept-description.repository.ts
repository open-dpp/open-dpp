import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ConceptDescription } from "../domain/concept-description";
import { findOne, findOneOrFail, save } from "./repository-helpers";
import { ConceptDescriptionDoc, ConceptDescriptionDocSchemaVersion } from "./schemas/concept-description.schema";

@Injectable()
export class ConceptDescriptionRepository {
  private conceptDescriptionDoc: MongooseModel<ConceptDescriptionDoc>;

  constructor(
    @InjectModel(ConceptDescriptionDoc.name)
    conceptDescriptionDoc: MongooseModel<ConceptDescriptionDoc>,
  ) {
    this.conceptDescriptionDoc = conceptDescriptionDoc;
  }

  async save(conceptDescription: ConceptDescription) {
    return await save(conceptDescription, this.conceptDescriptionDoc, ConceptDescriptionDocSchemaVersion.v1_0_0, ConceptDescription.fromPlain);
  }

  async findOneOrFail(id: string): Promise<ConceptDescription> {
    return await findOneOrFail(id, this.conceptDescriptionDoc, ConceptDescription.fromPlain);
  }

  async findOne(id: string): Promise<ConceptDescription | undefined> {
    return await findOne(id, this.conceptDescriptionDoc, ConceptDescription.fromPlain);
  }
}
