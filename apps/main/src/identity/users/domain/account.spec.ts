import { expect } from "@jest/globals";
import { Account } from "./account";

describe("account", () => {
  it("should create an account with valid properties", () => {
    const props = {
      userId: "user-123",
      accountId: "acc-123",
      providerId: "google",
      accessToken: "token",
    };

    const account = Account.create(props);

    expect(account.id).toBeDefined();
    expect(account.userId).toBe(props.userId);
    expect(account.accountId).toBe(props.accountId);
    expect(account.providerId).toBe(props.providerId);
    expect(account.accessToken).toBe(props.accessToken);
    expect(account.createdAt).toBeInstanceOf(Date);
    expect(account.updatedAt).toBeInstanceOf(Date);
  });

  it("should load account from database properties", () => {
    const now = new Date();
    const dbProps = {
      id: "account-123",
      userId: "user-123",
      accountId: "acc-123",
      providerId: "google",
      createdAt: now,
      updatedAt: now,
      accessToken: "token",
    };

    const account = Account.loadFromDb(dbProps);

    expect(account.id).toBe(dbProps.id);
    expect(account.userId).toBe(dbProps.userId);
    expect(account.accountId).toBe(dbProps.accountId);
    expect(account.providerId).toBe(dbProps.providerId);
    expect(account.createdAt).toEqual(dbProps.createdAt);
    expect(account.updatedAt).toEqual(dbProps.updatedAt);
    expect(account.accessToken).toBe(dbProps.accessToken);
  });
});
