import { forwardRef, Inject, Injectable } from "@nestjs/common";
import type { SetPolicyLimitsDto } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { Limit } from "../domain/limit";
import {
  PolicyDefinitions,
  PolicyKey,
  PolicyKeyList,
  PolicyQuotaRule,
} from "../domain/policy-rules";
import { Quota } from "../domain/quota";
import { LimitEvaluatorService } from "./limit-evaluator.service";
import { LimitRepository } from "./limit.repository";
import { QuotaRepository } from "./quota.repository";

interface PolicyRuleUtilization {
  key: string;
  used: number;
  limit: number;
  reset?: Date;
}

interface LimitAndValue {
  limit: number;
  used: number;
  reset?: Date;
}

@Injectable()
export class PolicyService {
  private readonly envService: EnvService;
  private readonly limitEvaluatorService: LimitEvaluatorService;

  constructor(
    private readonly limitRepository: LimitRepository,
    private readonly quotaRepository: QuotaRepository,
    envService: EnvService,
    @Inject(forwardRef(() => LimitEvaluatorService))
    limitEvaluatorService: LimitEvaluatorService,
  ) {
    this.envService = envService;
    this.limitEvaluatorService = limitEvaluatorService;
  }

  async isLimitReached(orgaId: string, key: PolicyKey): Promise<LimitAndValue> {
    const limit = await this.limitRepository.findOneByOrganizationIdAndKeyOrFail(orgaId, key);
    const used = await this.limitEvaluatorService.getCurrent(orgaId, key);

    return {
      limit: limit.getLimit(),
      used,
    };
  }

  async getQuota(organizationId: string, key: PolicyKey): Promise<Quota> {
    const quota = await this.quotaRepository.findOneByOrganizationIdAndKeyOrFail(
      organizationId,
      key,
    );

    if (quota.needsReset()) {
      quota.reset();
      return await this.quotaRepository.save(quota);
    }

    return quota;
  }

  async isQuotaExceeded(orgaId: string, key: PolicyKey): Promise<LimitAndValue> {
    let quota = await this.getQuota(orgaId, key);

    return {
      limit: quota.getLimit(),
      used: quota.getCount(),
      reset: quota.getNextReset(),
    };
  }

  async getQuotaOrFail(organizationId: string, key: PolicyKey): Promise<Quota> {
    const quota = await this.getQuota(organizationId, key);
    if (!quota) {
      throw new NotFoundInDatabaseException(Quota.name);
    }
    return quota;
  }

  async ensureDefaultPolicies(organizationId: string): Promise<void> {
    for (const rule of Object.values(PolicyDefinitions)) {
      if (rule.type === "quota") {
        try {
          await this.quotaRepository.findOneByOrganizationIdAndKeyOrFail(organizationId, rule.key);
        } catch (error) {
          if (error instanceof NotFoundInDatabaseException) {
            await this.quotaRepository.save(this.createDefaultQuota(organizationId, rule.key));
          }
        }
      } else {
        try {
          await this.limitRepository.findOneByOrganizationIdAndKeyOrFail(organizationId, rule.key);
        } catch (error) {
          if (error instanceof NotFoundInDatabaseException) {
            await this.limitRepository.save(this.createDefaultLimit(organizationId, rule.key));
          }
        }
      }
    }
  }

  /**
   * Overwrites the limit of every policy key present in `limits`. Keys that are
   * absent keep the limit they already have. Returns the utilization of all
   * policies afterwards, so the caller sees the new state in one round trip.
   */
  async setLimits(
    organizationId: string,
    limits: SetPolicyLimitsDto,
  ): Promise<Record<PolicyKey, LimitAndValue>> {
    for (const [key, limit] of Object.entries(limits) as [PolicyKey, number][]) {
      const rule = PolicyDefinitions[key];

      if (rule.type === "quota") {
        const quota = await this.getQuota(organizationId, key);
        await this.quotaRepository.save(quota.withLimit(limit));
      } else {
        const existing = await this.limitRepository.findOneByOrganizationIdAndKeyOrFail(
          organizationId,
          key,
        );
        await this.limitRepository.save(existing.withLimit(limit));
      }
    }

    return await this.getPolicyUtilization(organizationId);
  }

  async getPolicyUtilization(organizationId: string): Promise<Record<PolicyKey, LimitAndValue>> {
    const entries: [PolicyKey, LimitAndValue][] = [];

    for (const rule of Object.values(PolicyDefinitions)) {
      const utilization =
        rule.type === "quota"
          ? await this.isQuotaExceeded(organizationId, rule.key)
          : await this.isLimitReached(organizationId, rule.key);

      entries.push([rule.key, utilization]);
    }

    return Object.fromEntries(entries) as Record<PolicyKey, LimitAndValue>;
  }

  private createDefaultLimit(organizationId: string, key: PolicyKey): Limit {
    return Limit.create({
      key,
      organizationId,
      limit: this.getDefaultLimit(key),
    });
  }

  private createDefaultQuota(organizationId: string, key: PolicyKey): Quota {
    return Quota.create({
      key,
      organizationId,
      limit: this.getDefaultLimit(key),
      period: this.getQuotaRule(key).period,
    });
  }

  private getDefaultLimit(key: PolicyKey): number {
    const rule = PolicyDefinitions[key];

    return this.envService.get(rule.defaultlimit);
  }

  private getQuotaRule(key: PolicyKey): PolicyQuotaRule {
    const rule = PolicyDefinitions[key];

    if (rule.type !== "quota") {
      throw new Error(`Policy ${PolicyKeyList[key]} is not a quota rule`);
    }

    return rule as PolicyQuotaRule;
  }

  async enforce(organizationId: string, keys: PolicyKey[]): Promise<PolicyRuleUtilization | null> {
    let result: PolicyRuleUtilization | null = null;

    for (const key of keys) {
      const rule = PolicyDefinitions[key];

      let limitAndValue: LimitAndValue;
      if (rule.type === "limit") {
        limitAndValue = await this.isLimitReached(organizationId, key);
      } else {
        limitAndValue = await this.isQuotaExceeded(organizationId, key);
      }

      if (limitAndValue.limit !== 0 && limitAndValue.used >= limitAndValue.limit) {
        result = {
          key: PolicyKeyList[key],
          ...limitAndValue,
        };
      }
    }

    return result;
  }

  async incrementQuota(organizationId: string, key: PolicyKey, amount: number = 1): Promise<Quota> {
    const quota =
      (await this.getQuota(organizationId, key)) ?? this.createDefaultQuota(organizationId, key);

    quota.increment(amount);
    return await this.quotaRepository.save(quota);
  }
}
