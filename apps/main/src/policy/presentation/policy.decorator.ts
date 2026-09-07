import { SetMetadata } from "@nestjs/common";
import type { PolicyKey } from "@open-dpp/dto";

export const POLICY_META = "policy:keys";

export const Policy = (...keys: PolicyKey[]) => SetMetadata(POLICY_META, keys);
