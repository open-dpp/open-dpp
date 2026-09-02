import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { PolicyKey } from "../domain/policy-rules";
import { Quota } from "../domain/quota";
import { QuotaDoc } from "./quota.schema";
import { NotFoundInDatabaseException } from "@open-dpp/exception";

@Injectable()
export class QuotaRepository {
  private readonly quotaDoc: MongooseModel<QuotaDoc>;

  constructor(
    @InjectModel(QuotaDoc.name)
    quotaDoc: MongooseModel<QuotaDoc>,
  ) {
    this.quotaDoc = quotaDoc;
  }

  convertToDomain(quotaDoc: QuotaDoc): Quota {
    return Quota.loadFromDb({
      key: quotaDoc.key,
      organizationId: quotaDoc.organizationId,
      limit: quotaDoc.limit,
      count: quotaDoc.count,
      period: quotaDoc.period,
      lastSetBack: quotaDoc.lastSetBack,
    });
  }

  async findOneByOrganizationIdAndKeyOrFail(
    organizationId: string,
    key: PolicyKey,
  ): Promise<Quota> {
    const quotaDoc = await this.quotaDoc.findOne({ key, organizationId }).exec();
    if (!quotaDoc) {
      throw new NotFoundInDatabaseException(this.quotaDoc.modelName);
    }

    return this.convertToDomain(quotaDoc);
  }

  async findAllByOrganizationId(organizationId: string): Promise<Quota[]> {
    const quotaDocs = await this.quotaDoc.find({ organizationId }).exec();
    return quotaDocs.map((quotaDoc) => this.convertToDomain(quotaDoc));
  }

  async save(quota: Quota): Promise<Quota> {
    const quotaDoc = await this.quotaDoc
      .findOneAndUpdate(
        { key: quota.getKey(), organizationId: quota.getOrganizationId() },
        {
          $set: {
            key: quota.getKey(),
            organizationId: quota.getOrganizationId(),
            limit: quota.getLimit(),
            count: quota.getCount(),
            period: quota.getPeriod(),
            lastSetBack: quota.getLastReset(),
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      )
      .exec();

    return this.convertToDomain(quotaDoc);
  }
}
