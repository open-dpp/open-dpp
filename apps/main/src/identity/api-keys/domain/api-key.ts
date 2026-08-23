import {
  ConvertToPlainOptions,
  IConvertableToPlain,
} from "../../../aas/domain/convertable-to-plain";

export interface ApiKeyDbProps {
  id: string;
  name: string;
  userId: string;
  start: string | null;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

/**
 * User-bound API key. Creation and the plain key value live in better-auth
 * (hashed storage, show-once); this entity only models the managed metadata.
 */
export class ApiKey implements IConvertableToPlain {
  private readonly _expiresAt: Date | null;
  private readonly _lastUsedAt: Date | null;
  private readonly _createdAt: Date;

  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly userId: string,
    public readonly start: string | null,
    expiresAt: Date | null,
    lastUsedAt: Date | null,
    createdAt: Date,
  ) {
    // Dates are cloned on store and on read so callers can never mutate the
    // entity through a shared Date reference.
    this._expiresAt = expiresAt ? new Date(expiresAt.getTime()) : null;
    this._lastUsedAt = lastUsedAt ? new Date(lastUsedAt.getTime()) : null;
    this._createdAt = new Date(createdAt.getTime());
  }

  public get expiresAt(): Date | null {
    return this._expiresAt ? new Date(this._expiresAt.getTime()) : null;
  }

  public get lastUsedAt(): Date | null {
    return this._lastUsedAt ? new Date(this._lastUsedAt.getTime()) : null;
  }

  public get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }

  public static loadFromDb(data: ApiKeyDbProps): ApiKey {
    return new ApiKey(
      data.id,
      data.name,
      data.userId,
      data.start,
      data.expiresAt,
      data.lastUsedAt,
      data.createdAt,
    );
  }

  public withName(name: string): ApiKey {
    return new ApiKey(
      this.id,
      name,
      this.userId,
      this.start,
      this.expiresAt,
      this.lastUsedAt,
      this.createdAt,
    );
  }

  public toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      userId: this.userId,
      start: this.start,
      expiresAt: this.expiresAt,
      lastUsedAt: this.lastUsedAt,
      createdAt: this.createdAt,
    };
  }
}
