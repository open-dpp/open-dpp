import { randomBytes } from "node:crypto";

import { Expose } from "class-transformer";

export interface AccountCreateProps {
  userId: string;
  accountId: string;
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  refreshTokenExpiresAt?: Date;
  scope?: string;
  idToken?: string;
  password?: string;
}

export type AccountDbProps = AccountCreateProps & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export class Account {
  @Expose()
  public readonly id: string;

  @Expose()
  public readonly userId: string;

  @Expose()
  public readonly accountId: string;

  @Expose()
  public readonly providerId: string;

  @Expose()
  public readonly accessToken?: string;

  @Expose()
  public readonly refreshToken?: string;

  @Expose()
  public readonly accessTokenExpiresAt?: Date;

  @Expose()
  public readonly refreshTokenExpiresAt?: Date;

  @Expose()
  public readonly scope?: string;

  @Expose()
  public readonly idToken?: string;

  @Expose()
  public readonly password?: string;

  @Expose()
  public readonly createdAt: Date;

  @Expose()
  public readonly updatedAt: Date;

  private constructor(
    id: string,
    userId: string,
    accountId: string,
    providerId: string,
    createdAt: Date,
    updatedAt: Date,
    accessToken?: string,
    refreshToken?: string,
    accessTokenExpiresAt?: Date,
    refreshTokenExpiresAt?: Date,
    scope?: string,
    idToken?: string,
    password?: string,
  ) {
    this.id = id;
    this.userId = userId;
    this.accountId = accountId;
    this.providerId = providerId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.accessTokenExpiresAt = accessTokenExpiresAt;
    this.refreshTokenExpiresAt = refreshTokenExpiresAt;
    this.scope = scope;
    this.idToken = idToken;
    this.password = password;
  }

  public static create(data: AccountCreateProps) {
    const now = new Date();
    // ID generation would typically happen here or in the repo.
    // Assuming for now the ID is generated externally or we need a generator similar to User.
    // However, the User entity had a generate24CharId function. I should probably duplicate that or import it if possible,
    // but utils.ts was in the root which might not be accessible or I should just copy it.
    // Looking at User.ts again, it had generate24CharId locally defined. I will do the same.

    // BUT wait, better-auth might handle IDs differently? The prompt says "id string Unique identifier".
    // I will use a simple implementation for now, or just assume the ID is passed in props if it was consistent with others.
    // Re-reading User.ts: generate24CharId IS usage. I will copy it.

    return new Account(
      generate24CharId(),
      data.userId,
      data.accountId,
      data.providerId,
      now,
      now,
      data.accessToken,
      data.refreshToken,
      data.accessTokenExpiresAt,
      data.refreshTokenExpiresAt,
      data.scope,
      data.idToken,
      data.password,
    );
  }

  public static loadFromDb(data: AccountDbProps) {
    return new Account(
      data.id,
      data.userId,
      data.accountId,
      data.providerId,
      data.createdAt,
      data.updatedAt,
      data.accessToken,
      data.refreshToken,
      data.accessTokenExpiresAt,
      data.refreshTokenExpiresAt,
      data.scope,
      data.idToken,
      data.password,
    );
  }
}

function generate24CharId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = randomBytes(8).toString("hex");
  return timestamp + random;
}
