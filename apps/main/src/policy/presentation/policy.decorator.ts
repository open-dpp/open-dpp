import { SetMetadata } from "@nestjs/common";
import { PolicyKey } from "../domain/policy";

export const POLICY_META = "policy:keys";

export const Policy = (...keys: PolicyKey[]) => SetMetadata(POLICY_META, keys);
