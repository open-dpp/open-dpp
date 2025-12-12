import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Submodel } from "../domain/submodel-base/submodel";
import { findOne, findOneOrFail, save } from "./repository-helpers";
import { SubmodelDbSchema } from "./schemas/submodel-base/submodel-db-schema";
import { SubmodelDoc, SubmodelDocSchemaVersion } from "./schemas/submodel.schema";

@Injectable()
export class SubmodelRepository {
  private submodelDoc: MongooseModel<SubmodelDoc>;

  constructor(
    @InjectModel(SubmodelDoc.name)
    submodelDoc: MongooseModel<SubmodelDoc>,
  ) {
    this.submodelDoc = submodelDoc;
  }

  fromPlain(plain: any): Submodel {
    return Submodel.fromPlain(SubmodelDbSchema.encode(plain));
  }

  async save(submodel: Submodel) {
    return await save(submodel, this.submodelDoc, SubmodelDocSchemaVersion.v1_0_0, this.fromPlain, SubmodelDbSchema);
  }

  async findOneOrFail(id: string): Promise<Submodel> {
    return await findOneOrFail(id, this.submodelDoc, this.fromPlain);
  }

  async findOne(id: string): Promise<Submodel | undefined> {
    return await findOne(id, this.submodelDoc, this.fromPlain);
  }
}
