import { ValueError } from "@open-dpp/exception";
import { PolicyKey } from "./policy-rules";

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
  private key: PolicyKey;
  private organizationId: string;
  private limit: number;

  protected constructor(key: PolicyKey, limit: number, organizationId: string) {
    this.key = key;
    this.limit = limit;
    this.organizationId = organizationId;
  }

  /**
   * A limit counts things, so it has to be a whole, non-negative number.
   * 0 is allowed and means unlimited.
   */
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
