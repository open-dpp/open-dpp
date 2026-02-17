import { randomUUID } from "node:crypto";

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
  public readonly id: string;
  public readonly userId: string;
  public readonly accountId: string;
  public readonly providerId: string;
  public readonly accessToken?: string;
  public readonly refreshToken?: string;
  public readonly accessTokenExpiresAt?: Date;
  public readonly refreshTokenExpiresAt?: Date;
  public readonly scope?: string;
  public readonly idToken?: string;
  public readonly password?: string;
  public readonly createdAt: Date;
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

    return new Account(
      randomUUID(),
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
