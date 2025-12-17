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
      lastSetBack: quotaDoc.lastSetBac,
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

  async isCapReached(orgaId: string, key: PolicyKey) {
    const cap = await this.getCap(orgaId, key);
    const currentCapCount = await this.capEvaluatorService.getCurrent(orgaId, key);

    return currentCapCount >= cap.getLimit();
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

  async isQuotaExceeded(orgaId: string, key: PolicyKey) {
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

    return quota.isExceeded();
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

  private getQuotaRule(key: PolicyKey) {
    return PolicyDefinitions[key] as PolicyQuotaRule;
  }

  async enforce(organizationId: string, keys: PolicyKey[]): Promise<void> {
    for (const key of keys) {
      const rule = PolicyDefinitions[key];

      if (rule.type === "cap") {
        const capReached = await this.isCapReached(organizationId, key);
        if (capReached) {
          throw new Error(`Cap reached for policy: ${rule.description}`);
        }
      }
      else if (rule.type === "quota") {
        const quotaExceeded = await this.isQuotaExceeded(organizationId, key);
        if (quotaExceeded) {
          throw new Error(`Quota exceeded for policy: ${rule.description}`);
        }
      }
    }
  }
}
