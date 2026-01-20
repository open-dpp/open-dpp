import type { Model as MongooseModel } from "mongoose";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { Cap } from "../domain/cap";
import { PolicyDefinitions, PolicyKey, PolicyQuotaRule } from "../domain/policy";
import { Quota } from "../domain/quota";
import { CapEvaluatorService } from "./cap-evaluator.service";
import { CapDoc } from "./cap.schema";
import { QuotaDoc } from "./quota.schema";

interface EnforceResult {
  key: string;
  used: number;
  limit: number;
}

interface LimitAndValue {
  limit: number;
  used: number;
}

@Injectable()
export class PolicyService {
  private readonly envService: EnvService;
  private readonly capEvaluatorService: CapEvaluatorService;

  constructor(
    @InjectModel(CapDoc.name)
    private readonly capModel: MongooseModel<CapDoc>,
    @InjectModel(QuotaDoc.name)
    private readonly quotaModel: MongooseModel<QuotaDoc>,
    envService: EnvService,
    @Inject(forwardRef(() => CapEvaluatorService))
    capEvaluatorService: CapEvaluatorService,
  ) {
    this.envService = envService;
    this.capEvaluatorService = capEvaluatorService;
  }

  private convertCapToDomain(capDoc: CapDoc): Cap {
    return Cap.loadFromDb({
      key: capDoc.key,
      organizationId: capDoc.organizationId,
      limit: capDoc.limit,
    });
  }

  private convertQuotaToDomain(quotaDoc: QuotaDoc): Quota {
    return Quota.loadFromDb({
      key: quotaDoc.key,
      organizationId: quotaDoc.organizationId,
      limit: quotaDoc.limit,
      count: quotaDoc.count,
      period: quotaDoc.period,
      lastSetBack: quotaDoc.lastSetBack,
    });
  }

  async getCap(organizationId: string, key: PolicyKey): Promise<Cap> {
    const capDoc = await this.capModel.findOne({ key, organizationId }).exec();

    if (!capDoc) {
      const defaultLimit = this.getDefaultLimit(key);

      return Cap.create({
        key,
        organizationId,
        limit: defaultLimit,
      });
    }

    return this.convertCapToDomain(capDoc);
  }

  async saveCap(cap: Cap): Promise<Cap> {
    const capDoc = await this.capModel.findOneAndUpdate(
      { key: cap.getKey(), organizationId: cap.getOrganizationId() },
      {
        $set: {
          key: cap.getKey(),
          organizationId: cap.getOrganizationId(),
          limit: cap.getLimit(),
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

  async isCapReached(orgaId: string, key: PolicyKey): Promise<LimitAndValue> {
    const cap = await this.getCap(orgaId, key);
    const currentCapCount = await this.capEvaluatorService.getCurrent(orgaId, key);

    return {
      limit: cap.getLimit(),
      used: currentCapCount,
    };
  }

  async getQuota(organizationId: string, key: PolicyKey): Promise<Quota | undefined> {
    const quotaDoc = await this.quotaModel.findOne({ key, organizationId }).exec();

    if (!quotaDoc) {
      return undefined;
    }

    const quota = this.convertQuotaToDomain(quotaDoc);

    if (quota.needsReset()) {
      quota.reset();
      return await this.saveQuota(quota);
    }

    return quota;
  }

  async isQuotaExceeded(orgaId: string, key: PolicyKey): Promise<LimitAndValue> {
    let quota = await this.getQuota(orgaId, key);
    if (!quota) {
      const defaultLimit = this.getDefaultLimit(key);
      const quotaRule = this.getQuotaRule(key);
      quota = Quota.create({
        key,
        organizationId: orgaId,
        limit: defaultLimit,
        period: quotaRule.period,
      });

      quota = await this.saveQuota(quota);
    }

    return {
      limit: quota.getLimit(),
      used: quota.getCount(),
    };
  }

  async getQuotaOrFail(organizationId: string, key: PolicyKey): Promise<Quota> {
    const quota = await this.getQuota(organizationId, key);
    if (!quota) {
      throw new NotFoundInDatabaseException(Quota.name);
    }
    return quota;
  }

  async saveQuota(quota: Quota): Promise<Quota> {
    const quotaDoc = await this.quotaModel.findOneAndUpdate(
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
    ).exec();

    return this.convertQuotaToDomain(quotaDoc);
  }

  private getDefaultLimit(key: PolicyKey): number {
    const rule = PolicyDefinitions[key];

    return this.envService.get(rule.defaultlimit);
  }

  private getQuotaRule(key: PolicyKey): PolicyQuotaRule {
    const rule = PolicyDefinitions[key];

    if (rule.type !== "quota") {
      throw new Error(`Policy ${PolicyKey[key]} is not a quota rule`);
    }

    return rule as PolicyQuotaRule;
  }

  async enforce(organizationId: string, keys: PolicyKey[]): Promise<EnforceResult | null> {
    let result: EnforceResult | null = null;

    for (const key of keys) {
      const rule = PolicyDefinitions[key];

      let limitAndValue: LimitAndValue;
      if (rule.type === "cap") {
        limitAndValue = await this.isCapReached(organizationId, key);
      }
      else {
        limitAndValue = await this.isQuotaExceeded(organizationId, key);
      }

      if (limitAndValue.limit !== 0 && limitAndValue.used >= limitAndValue.limit) {
        result = {
          key: PolicyKey[key],
          limit: limitAndValue.limit,
          used: limitAndValue.used,
        };
      }
    }

    return result;
  }

  async incrementQuota(organizationId: string, key: PolicyKey, amount: number = 1): Promise<Quota> {
    let quota = await this.getQuota(organizationId, key);

    if (!quota) {
      const defaultLimit = this.getDefaultLimit(key);
      const quotaRule = this.getQuotaRule(key);
      quota = Quota.create({
        key,
        organizationId,
        limit: defaultLimit,
        period: quotaRule.period,
      });
    }

    quota.increment(amount);
    return await this.saveQuota(quota);
  }
}
