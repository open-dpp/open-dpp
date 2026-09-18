import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Limit } from "../domain/limit";
import { LimitDoc } from "./limit.schema";
import { PolicyDocSchemaVersion } from "./policy.schema";
import { NotFoundError } from "@open-dpp/exception";
import type { PolicyKey } from "@open-dpp/dto";

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

  async findOneByOrganizationIdAndKey(
    organizationId: string,
    key: PolicyKey,
  ): Promise<Limit | undefined> {
    const limitDoc = await this.limitDoc.findOne({ key, organizationId }).exec();
    if (!limitDoc) {
      return undefined;
    }

    return this.convertToDomain(limitDoc);
  }

  async findOneByOrganizationIdAndKeyOrFail(
    organizationId: string,
    key: PolicyKey,
  ): Promise<Limit> {
    const limit = await this.findOneByOrganizationIdAndKey(organizationId, key);
    if (!limit) {
      throw new NotFoundError(this.limitDoc.modelName);
    }

    return limit;
  }

  async findAllByOrganizationId(organizationId: string): Promise<Limit[]> {
    const limitDocs = await this.limitDoc.find({ organizationId }).exec();
    return limitDocs.map((limitDoc) => this.convertToDomain(limitDoc));
  }

  async update(limit: Limit): Promise<Limit> {
    let limitDoc = await this.limitDoc
      .findOne({ key: limit.getKey(), organizationId: limit.getOrganizationId() })
      .exec();
    if (!limitDoc) {
      limitDoc = new this.limitDoc();
    }

    limitDoc.set({
      _schemaVersion: PolicyDocSchemaVersion.v1_0_0,
      key: limit.getKey(),
      organizationId: limit.getOrganizationId(),
      limit: limit.getLimit(),
    });

    return this.convertToDomain(await limitDoc.save());
  }
}
