import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Quota } from "../domain/quota";
import { QuotaDoc } from "./quota.schema";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import type { PolicyKey } from "@open-dpp/dto";

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

  async findOneByOrganizationIdAndKey(
    organizationId: string,
    key: PolicyKey,
  ): Promise<Quota | undefined> {
    const quotaDoc = await this.quotaDoc.findOne({ key, organizationId }).exec();
    if (!quotaDoc) {
      return undefined;
    }

    return this.convertToDomain(quotaDoc);
  }

  async findOneByOrganizationIdAndKeyOrFail(
    organizationId: string,
    key: PolicyKey,
  ): Promise<Quota> {
    const quota = await this.findOneByOrganizationIdAndKey(organizationId, key);
    if (!quota) {
      throw new NotFoundInDatabaseException(this.quotaDoc.modelName);
    }

    return quota;
  }

  async findAllByOrganizationId(organizationId: string): Promise<Quota[]> {
    const quotaDocs = await this.quotaDoc.find({ organizationId }).exec();
    return quotaDocs.map((quotaDoc) => this.convertToDomain(quotaDoc));
  }

  async update(quota: Quota): Promise<Quota> {
    let quotaDoc = await this.quotaDoc
      .findOne({ key: quota.getKey(), organizationId: quota.getOrganizationId() })
      .exec();
    if (!quotaDoc) {
      quotaDoc = new this.quotaDoc();
    }

    quotaDoc.set({
      key: quota.getKey(),
      organizationId: quota.getOrganizationId(),
      limit: quota.getLimit(),
      count: quota.getCount(),
      period: quota.getPeriod(),
      lastSetBack: quota.getLastReset(),
    });

    return this.convertToDomain(await quotaDoc.save());
  }
}
