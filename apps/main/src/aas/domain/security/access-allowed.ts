export class AccessResult<T> {
  private constructor(
    private readonly _value: T | undefined,
    private readonly _reason: string | undefined,
  ) {}

  static allowed<T>(value: T): AccessResult<T> {
    return new AccessResult(value, undefined);
  }

  static denied<T = never>(reason: string = "missing-read-permission"): AccessResult<T> {
    return new AccessResult<T>(undefined, reason);
  }

  get isAllowed(): boolean {
    return this._reason === undefined;
  }

  get isDenied(): boolean {
    return !this.isAllowed;
  }

  get reason(): string | undefined {
    return this._reason;
  }

  get value(): T {
    if (this.isDenied) {
      throw new Error(`Cannot access denied AccessResult value. Reason: ${this._reason}`);
    }

    return this._value as T;
  }

  valueOrUndefined(): T | undefined {
    return this.isAllowed ? this._value : undefined;
  }

  map<R>(mapper: (value: T) => R): AccessResult<R> {
    if (this.isDenied) {
      return AccessResult.denied(this._reason);
    }

    return AccessResult.allowed(mapper(this.value));
  }

  flatMap<R>(mapper: (value: T) => AccessResult<R>): AccessResult<R> {
    if (this.isDenied) {
      return AccessResult.denied(this._reason);
    }

    return mapper(this.value);
  }

  match<R>(handlers: { allowed: (value: T) => R; denied: (reason: string | undefined) => R }): R {
    if (this.isAllowed) {
      return handlers.allowed(this.value);
    }

    return handlers.denied(this._reason);
  }
}
