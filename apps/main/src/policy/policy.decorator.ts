// policy.decorator.ts
import { SetMetadata } from "@nestjs/common";
import { QuotaPeriod } from "./domain/quota";

export interface PolicyRule {
  quota?: {
    key: string;
    defaultlimit: number;
    period: QuotaPeriod;
  };
  cap?: {
    key: string;
    defaultlimit: number;
  };
}

export const POLICY_KEY = "policy";

export function Policy(rule: PolicyRule) {
  return SetMetadata(POLICY_KEY, rule);
}
