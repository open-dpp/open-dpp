import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Limit } from "../domain/limit";
import { PolicyKey } from "../domain/policy-rules";
import { LimitDoc } from "./limit.schema";
import { NotFoundInDatabaseException } from "@open-dpp/exception";

@Injectable()
export class LimitRepository {
  private readonly limitDoc: MongooseModel<LimitDoc>;

  constructor(
    @InjectModel(LimitDoc.name)
    limitDoc: MongooseModel<LimitDoc>,
  ) {
    this.limitDoc = limitDoc;
  }

  convertToDomain(limitDoc: LimitDoc): Limit {
    return Limit.loadFromDb({
      key: limitDoc.key,
      organizationId: limitDoc.organizationId,
      limit: limitDoc.limit,
    });
  }

  async findOneByOrganizationIdAndKeyOrFail(
    organizationId: string,
    key: PolicyKey,
  ): Promise<Limit> {
    const limitDoc = await this.limitDoc.findOne({ key, organizationId }).exec();
    if (!limitDoc) {
      throw new NotFoundInDatabaseException(this.limitDoc.modelName);
    }

    return this.convertToDomain(limitDoc);
  }

  async findAllByOrganizationId(organizationId: string): Promise<Limit[]> {
    const limitDocs = await this.limitDoc.find({ organizationId }).exec();
    return limitDocs.map((limitDoc) => this.convertToDomain(limitDoc));
  }

  async save(limit: Limit): Promise<Limit> {
    const limitDoc = await this.limitDoc
      .findOneAndUpdate(
        { key: limit.getKey(), organizationId: limit.getOrganizationId() },
        {
          $set: {
            key: limit.getKey(),
            organizationId: limit.getOrganizationId(),
            limit: limit.getLimit(),
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      )
      .exec();

    return this.convertToDomain(limitDoc);
  }
}
