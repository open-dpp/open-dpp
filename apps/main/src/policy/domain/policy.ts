import type { PolicyKey } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";

export interface PolicyCreateProps {
  organizationId: string;
  key: PolicyKey;
  limit: number;
}

/**
 * A policy rule applied to a single organization: the cap on `key` that this
 * organization is held to. `Limit` is the plain form, `Quota` adds a counter
 * that resets each period.
 */
export abstract class Policy {
  private readonly key: PolicyKey;
  private readonly organizationId: string;
  private readonly limit: number;

  protected constructor(key: PolicyKey, limit: number, organizationId: string) {
    Policy.assertValidLimit(limit);
    this.key = key;
    this.limit = limit;
    this.organizationId = organizationId;
  }

  protected static assertValidLimit(limit: number): void {
    if (!Number.isInteger(limit) || limit < 0) {
      throw new ValueError(`Limit must be a non-negative integer, got ${limit}`);
    }
  }

  getKey() {
    return this.key;
  }

  getOrganizationId() {
    return this.organizationId;
  }

  getLimit(): number {
    return this.limit;
  }
}
