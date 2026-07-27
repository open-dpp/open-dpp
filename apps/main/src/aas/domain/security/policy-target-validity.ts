export class PolicyTargetValidity {
  private constructor(
    private readonly kind: "valid" | "invalid" | "unresolvable",
    private readonly _reason?: string,
  ) {}

  static valid(): PolicyTargetValidity {
    return new PolicyTargetValidity("valid");
  }

  static invalid(reason: string): PolicyTargetValidity {
    return new PolicyTargetValidity("invalid", reason);
  }

  static unresolvable(reason: string): PolicyTargetValidity {
    return new PolicyTargetValidity("unresolvable", reason);
  }

  get isValid(): boolean {
    return this.kind === "valid";
  }

  get isInvalid(): boolean {
    return this.kind === "invalid";
  }

  get isUnresolvable(): boolean {
    return this.kind === "unresolvable";
  }

  get reason(): string | undefined {
    return this._reason;
  }
}
