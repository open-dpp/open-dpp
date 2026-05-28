export class RegexFilter {
  private constructor(
    public readonly operation: string,
    public readonly value: string,
  ) {}

  static create(pattern: string) {
    const [op, value] = pattern.includes(":") ? pattern.split(":") : ["eq", pattern];
    return new RegexFilter(op, value);
  }

  toMongoFilter() {
    if (this.operation === "eq") {
      return this.value;
    } else if (this.operation === "sw") {
      return { $regex: `^${this.value}`, $options: "i" };
    }
  }

  test(otherValue: string): boolean {
    if (this.operation === "eq") {
      return this.value === otherValue;
    } else if (this.operation === "sw") {
      return new RegExp(`^${this.value}`, "i").test(otherValue);
    }
    return false;
  }
}
