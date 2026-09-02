import { type PolicyKey, PolicyKeyList } from "@open-dpp/dto";
import type { QuotaPeriod } from "./quota";
import { NumericEnvKeys } from "@open-dpp/env";
export { PolicyKeyEnum, PolicyKeyList } from "@open-dpp/dto";
export type { PolicyKey } from "@open-dpp/dto";

export interface PolicyLimitRule {
  type: "limit";
  key: PolicyKey;
  defaultlimit: NumericEnvKeys;
  description: string;
}

export interface PolicyQuotaRule {
  type: "quota";
  key: PolicyKey;
  defaultlimit: NumericEnvKeys;
  period: QuotaPeriod;
  description: string;
}

export type PolicyRule = PolicyLimitRule | PolicyQuotaRule;

export const PolicyDefinitions: Record<PolicyKey, PolicyRule> = {
  [PolicyKeyList.AI_TOKEN_QUOTA]: {
    type: "quota",
    key: PolicyKeyList.AI_TOKEN_QUOTA,
    defaultlimit: "OPEN_DPP_DEFAULT_AI_TOKEN_QUOTA",
    period: "month",
    description: "AI tokens",
  },
  [PolicyKeyList.MEDIA_STORAGE_LIMIT]: {
    type: "limit",
    key: PolicyKeyList.MEDIA_STORAGE_LIMIT,
    defaultlimit: "OPEN_DPP_DEFAULT_MEDIA_STORAGE_CAP",
    description: "Media storage in MB",
  },
  [PolicyKeyList.PASSPORT_CREATE_LIMIT]: {
    type: "limit",
    key: PolicyKeyList.PASSPORT_CREATE_LIMIT,
    defaultlimit: "OPEN_DPP_DEFAULT_MODEL_CREATE_CAP",
    description: "Models created",
  },
};
