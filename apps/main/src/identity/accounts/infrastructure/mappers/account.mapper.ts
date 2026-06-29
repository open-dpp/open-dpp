import { Account } from "../../domain/account";
import { AccountDocument } from "../schemas/account.schema";

export class AccountMapper {
  static toDomain(document: AccountDocument): Account {
    return Account.loadFromDb({
      id: document._id.toString(),
      userId: document.userId.toString(),
      accountId: document.accountId,
      providerId: document.providerId,
      accessToken: document.accessToken,
      refreshToken: document.refreshToken,
      accessTokenExpiresAt: document.accessTokenExpiresAt,
      refreshTokenExpiresAt: document.refreshTokenExpiresAt,
      scope: document.scope,
      idToken: document.idToken,
      password: document.password,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }
}
