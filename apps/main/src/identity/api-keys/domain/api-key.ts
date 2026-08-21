import { ConvertToPlainOptions, IConvertableToPlain } from "../../../aas/domain/convertable-to-plain";

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
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly userId: string,
    public readonly start: string | null,
    public readonly expiresAt: Date | null,
    public readonly lastUsedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

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
