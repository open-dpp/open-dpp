// policy.decorator.ts
import { NumericEnvKeys } from "@open-dpp/env/dist/env";
import { QuotaPeriod } from "./quota";

export interface PolicyCapRule {
  type: "cap";
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

export type PolicyRule = PolicyCapRule | PolicyQuotaRule;

export enum PolicyKey {
  AI_TOKEN_QUOTA,
  MEDIA_STORAGE_CAP,
  MODEL_CREATE_CAP,
}

export const PolicyDefinitions: Record<PolicyKey, PolicyRule> = {
  [PolicyKey.AI_TOKEN_QUOTA]: {
    type: "quota",
    key: PolicyKey.AI_TOKEN_QUOTA,
    defaultlimit: "OPEN_DPP_DEFAULT_AI_TOKEN_QUOTA",
    period: "month",
    description: "AI tokens",
  },
  [PolicyKey.MEDIA_STORAGE_CAP]: {
    type: "cap",
    key: PolicyKey.MEDIA_STORAGE_CAP,
    defaultlimit: "OPEN_DPP_DEFAULT_MEDIA_STORAGE_CAP",
    description: "Media storage in MB",
  },
  [PolicyKey.MODEL_CREATE_CAP]: {
    type: "cap",
    key: PolicyKey.MODEL_CREATE_CAP,
    defaultlimit: "OPEN_DPP_DEFAULT_MODEL_CREATE_CAP",
    description: "Models created",
  },
};
