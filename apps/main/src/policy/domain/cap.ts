import { PolicyKey } from "./policy";

export interface CapCreateProps {
  organizationId: string;
  key: PolicyKey;
  limit: number;
}

export type CapCreateDbProps = CapCreateProps;

export class Cap {
  private key: PolicyKey;
  private organizationId: string;
  private limit: number;

  protected constructor(key: PolicyKey, limit: number, organizationId: string) {
    this.key = key;
    this.limit = limit;
    this.organizationId = organizationId;
  }

  static create(props: CapCreateProps) {
    return new Cap(props.key, props.limit, props.organizationId);
  }

  static loadFromDb(props: CapCreateDbProps) {
    return new Cap(props.key, props.limit, props.organizationId);
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
