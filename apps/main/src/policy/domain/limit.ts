import { Policy, PolicyCreateProps } from "./policy";
import { PolicyKey } from "./policy-rules";

export type LimitCreateProps = PolicyCreateProps;

export type LimitCreateDbProps = LimitCreateProps;

export class Limit extends Policy {
  protected constructor(key: PolicyKey, limit: number, organizationId: string) {
    super(key, limit, organizationId);
  }

  static create(props: LimitCreateProps) {
    return new Limit(props.key, props.limit, props.organizationId);
  }

  static loadFromDb(props: LimitCreateDbProps) {
    return new Limit(props.key, props.limit, props.organizationId);
  }

  withLimit(limit: number): Limit {
    Limit.assertValidLimit(limit);

    return new Limit(this.getKey(), limit, this.getOrganizationId());
  }
}
