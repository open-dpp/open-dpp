import { Injectable } from "@nestjs/common";
import { type PolicyKey, type SetPolicyLimitsDto } from "@open-dpp/dto";
import { PolicyDefinitions } from "../../domain/policy-rules";
import { LimitRepository } from "../../infrastructure/limit.repository";
import { type LimitAndValue, PolicyService } from "../../infrastructure/policy.service";
import { QuotaRepository } from "../../infrastructure/quota.repository";

@Injectable()
export class PolicyManagementService {
  constructor(
    private readonly limitRepository: LimitRepository,
    private readonly quotaRepository: QuotaRepository,
    private readonly policyService: PolicyService,
  ) {}

  async ensureDefaultPolicies(organizationId: string): Promise<void> {
    for (const rule of Object.values(PolicyDefinitions)) {
      if (rule.type === "quota") {
        const quota = await this.quotaRepository.findOneByOrganizationIdAndKey(
          organizationId,
          rule.key,
        );
        if (!quota) {
          await this.quotaRepository.update(
            this.policyService.createDefaultQuota(organizationId, rule.key),
          );
        }
      } else {
        const limit = await this.limitRepository.findOneByOrganizationIdAndKey(
          organizationId,
          rule.key,
        );
        if (!limit) {
          await this.limitRepository.update(
            this.policyService.createDefaultLimit(organizationId, rule.key),
          );
        }
      }
    }
  }

  async setLimits(
    organizationId: string,
    limits: SetPolicyLimitsDto,
  ): Promise<Record<PolicyKey, LimitAndValue>> {
    for (const [key, limit] of Object.entries(limits) as [PolicyKey, number][]) {
      const rule = PolicyDefinitions[key];

      if (rule.type === "quota") {
        const quota = await this.quotaRepository.findOneByOrganizationIdAndKeyOrFail(
          organizationId,
          key,
        );
        await this.quotaRepository.update(quota.withLimit(limit));
      } else {
        const existing = await this.limitRepository.findOneByOrganizationIdAndKeyOrFail(
          organizationId,
          key,
        );
        await this.limitRepository.update(existing.withLimit(limit));
      }
    }

    return await this.getPolicyUtilization(organizationId);
  }

  async getPolicyUtilization(organizationId: string): Promise<Record<PolicyKey, LimitAndValue>> {
    const entries: [PolicyKey, LimitAndValue][] = [];

    for (const rule of Object.values(PolicyDefinitions)) {
      const utilization =
        rule.type === "quota"
          ? await this.policyService.isQuotaExceeded(organizationId, rule.key)
          : await this.policyService.isLimitReached(organizationId, rule.key);

      entries.push([rule.key, utilization]);
    }

    return Object.fromEntries(entries) as Record<PolicyKey, LimitAndValue>;
  }
}
