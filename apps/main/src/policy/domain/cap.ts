export interface CapCreateProps {
  key: string;
  limit: number;
}

export type CapCreateDbProps = CapCreateProps & {
  count: number;
};

export class Cap {
  key: string;
  limit: number;
  count: number;

  protected constructor(key: string, limit: number, count: number) {
    this.key = key;
    this.limit = limit;
    this.count = count;
  }

  static create(props: CapCreateProps) {
    return new Cap(props.key, props.limit, 0);
  }

  static loadFromDb(props: CapCreateDbProps) {
    return new Cap(props.key, props.limit, props.count);
  }

  isReached() {
    return this.count >= this.limit;
  }

  getLimit(): number {
    return this.limit;
  }

  getCount(): number {
    return this.count;
  }

  increase(amount: number) {
    this.count += amount;
  }
}
