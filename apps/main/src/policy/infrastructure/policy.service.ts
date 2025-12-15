import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { Cap } from "../domain/cap";
import { Quota } from "../domain/quota";
import { CapDoc } from "./cap.schema";
import { QuotaDoc } from "./quota.schema";

@Injectable()
export class PolicyService {
  constructor(
    @InjectModel(CapDoc.name)
    private readonly capModel: MongooseModel<CapDoc>,
    @InjectModel(QuotaDoc.name)
    private readonly quotaModel: MongooseModel<QuotaDoc>,
  ) {}

  private convertCapToDomain(capDoc: CapDoc): Cap {
    return Cap.loadFromDb({
      key: capDoc.key,
      limit: capDoc.limit,
      count: capDoc.count,
    });
  }

  private convertQuotaToDomain(quotaDoc: QuotaDoc): Quota {
    return Quota.loadFromDb({
      key: quotaDoc.key,
      limit: quotaDoc.limit,
      count: quotaDoc.count,
      period: quotaDoc.period,
      lastSetBack: quotaDoc.lastSetBac,
    });
  }

  async getCap(organizationId: string, key: string): Promise<Cap | undefined> {
    const capKey = this.capKey(organizationId, key);
    const capDoc = await this.capModel.findOne({ key: capKey }).exec();

    if (!capDoc) {
      return undefined;
    }

    return this.convertCapToDomain(capDoc);
  }

  async getCapOrFail(organizationId: string, key: string): Promise<Cap> {
    const cap = await this.getCap(organizationId, key);
    if (!cap) {
      throw new NotFoundInDatabaseException(Cap.name);
    }
    return cap;
  }

  async saveCap(organizationId: string, cap: Cap): Promise<Cap> {
    const capKey = this.capKey(organizationId, cap.key);
    const capDoc = await this.capModel.findOneAndUpdate(
      { key: capKey },
      {
        $set: {
          key: capKey,
          limit: cap.getLimit(),
          count: cap.getCount(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    ).exec();

    return this.convertCapToDomain(capDoc);
  }

  async incrementCap(organizationId: string, key: string, delta: number): Promise<Cap> {
    const capKey = this.capKey(organizationId, key);

    const capDoc = await this.capModel.findOneAndUpdate(
      { key: capKey },
      {
        $inc: { count: delta },
      },
      {
        new: true,
        upsert: false,
      },
    ).exec();

    if (!capDoc) {
      throw new NotFoundInDatabaseException(Cap.name);
    }

    return this.convertCapToDomain(capDoc);
  }

  async getQuota(organizationId: string, key: string): Promise<Quota | undefined> {
    const quotaKey = this.quotaKey(organizationId, key);
    const quotaDoc = await this.quotaModel.findOne({ key: quotaKey }).exec();

    if (!quotaDoc) {
      return undefined;
    }

    const quota = this.convertQuotaToDomain(quotaDoc);

    // Check if quota needs reset
    if (quota.needsReset()) {
      quota.reset();
      return await this.saveQuota(organizationId, quota);
    }

    return quota;
  }

  async getQuotaOrFail(organizationId: string, key: string): Promise<Quota> {
    const quota = await this.getQuota(organizationId, key);
    if (!quota) {
      throw new NotFoundInDatabaseException(Quota.name);
    }
    return quota;
  }

  async saveQuota(organizationId: string, quota: Quota): Promise<Quota> {
    const quotaKey = this.quotaKey(organizationId, quota.key);
    const quotaDoc = await this.quotaModel.findOneAndUpdate(
      { key: quotaKey },
      {
        $set: {
          key: quotaKey,
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
    ).exec();

    return this.convertQuotaToDomain(quotaDoc);
  }

  async incrementQuota(organizationId: string, key: string): Promise<Quota> {
    const quota = await this.getQuota(organizationId, key);

    if (!quota) {
      throw new NotFoundInDatabaseException(Quota.name);
    }

    quota.increase(1);
    return await this.saveQuota(organizationId, quota);
  }

  private capKey(organizationId: string, key: string): string {
    return `cap:${organizationId}:${key}`;
  }

  private quotaKey(organizationId: string, key: string): string {
    return `quota:${organizationId}:${key}`;
  }
}
