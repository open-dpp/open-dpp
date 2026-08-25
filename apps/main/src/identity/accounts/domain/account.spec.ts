import { expect } from "@jest/globals";
import { Account } from "./account";

describe("account", () => {
  it("loads an account from database properties", () => {
    const now = new Date();
    const dbProps = {
      id: "account-123",
      userId: "user-123",
      accountId: "acc-123",
      providerId: "credential",
      createdAt: now,
      updatedAt: now,
      accessToken: "token",
      password: "hashed-password",
    };

    const account = Account.loadFromDb(dbProps);

    expect(account.id).toBe(dbProps.id);
    expect(account.userId).toBe(dbProps.userId);
    expect(account.accountId).toBe(dbProps.accountId);
    expect(account.providerId).toBe(dbProps.providerId);
    expect(account.createdAt).toEqual(dbProps.createdAt);
    expect(account.updatedAt).toEqual(dbProps.updatedAt);
    expect(account.accessToken).toBe(dbProps.accessToken);
    expect(account.password).toBe(dbProps.password);
  });
});
