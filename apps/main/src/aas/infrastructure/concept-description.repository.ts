import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { findOne, findOneOrFail, save } from "../../lib/repositories";
import { ConceptDescription } from "../domain/concept-description";
import { ConceptDescriptionDbSchema } from "./schemas/concept-description-db-schema";
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

  fromPlain(plain: any): ConceptDescription {
    return ConceptDescription.fromPlain(ConceptDescriptionDbSchema.encode(plain));
  }

  async save(conceptDescription: ConceptDescription) {
    return await save(conceptDescription, this.conceptDescriptionDoc, ConceptDescriptionDocSchemaVersion.v1_0_0, this.fromPlain, ConceptDescriptionDbSchema);
  }

  async findOneOrFail(id: string): Promise<ConceptDescription> {
    return await findOneOrFail(id, this.conceptDescriptionDoc, this.fromPlain);
  }

  async findOne(id: string): Promise<ConceptDescription | undefined> {
    return await findOne(id, this.conceptDescriptionDoc, this.fromPlain);
  }
}
