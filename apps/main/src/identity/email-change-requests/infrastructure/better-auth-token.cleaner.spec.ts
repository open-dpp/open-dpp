import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Connection } from "mongoose";
import { BetterAuthTokenCleaner } from "./better-auth-token.cleaner";

describe("BetterAuthTokenCleaner", () => {
  let deleteMany: jest.Mock<(filter: unknown) => Promise<{ deletedCount: number }>>;
  let collection: jest.Mock;
  let db: { collection: jest.Mock };
  let cleaner: BetterAuthTokenCleaner;

  beforeEach(() => {
    deleteMany = jest
      .fn<(filter: unknown) => Promise<{ deletedCount: number }>>()
      .mockResolvedValue({ deletedCount: 0 });
    collection = jest.fn().mockReturnValue({ deleteMany });
    db = { collection };

    // The cleaner accepts either a Mongoose Connection (with `.db` property) or a Db directly.
    // We pass a connection-shaped object so the constructor's defensive branch is exercised.
    const connectionLike = { db } as unknown as Connection;
    cleaner = new BetterAuthTokenCleaner(connectionLike);
  });

  it("deletes verification rows whose identifier matches the change-email prefix and userId", async () => {
    await cleaner.invalidateChangeEmailTokens("user-1");

    expect(collection).toHaveBeenCalledWith("verification");
    expect(deleteMany).toHaveBeenCalledTimes(1);

    const filter = deleteMany.mock.calls[0][0] as { identifier: { $regex: string } };
    expect(filter).toHaveProperty("identifier");
    expect(filter.identifier).toHaveProperty("$regex");
    expect(filter.identifier.$regex).toContain("user-1");
    expect(filter.identifier.$regex).toContain("change-email");
  });

  it("does not throw when no verification rows match", async () => {
    deleteMany.mockResolvedValueOnce({ deletedCount: 0 });

    await expect(cleaner.invalidateChangeEmailTokens("user-no-match")).resolves.not.toThrow();
  });
});
