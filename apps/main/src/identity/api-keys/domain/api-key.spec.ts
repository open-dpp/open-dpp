import { describe, expect, it } from "@jest/globals";
import { ApiKey } from "./api-key";

const dbProps = {
  id: "key-1",
  name: "CI pipeline",
  userId: "user-1",
  start: "opendpp_ab",
  expiresAt: new Date("2027-01-01T00:00:00.000Z"),
  lastUsedAt: null,
  createdAt: new Date("2026-08-21T00:00:00.000Z"),
};

describe("ApiKey", () => {
  it("loads from db props", () => {
    const apiKey = ApiKey.loadFromDb(dbProps);
    expect(apiKey.id).toBe("key-1");
    expect(apiKey.name).toBe("CI pipeline");
    expect(apiKey.userId).toBe("user-1");
    expect(apiKey.start).toBe("opendpp_ab");
    expect(apiKey.expiresAt).toEqual(new Date("2027-01-01T00:00:00.000Z"));
    expect(apiKey.lastUsedAt).toBeNull();
  });

  it("withName returns a new instance and keeps the original untouched", () => {
    const apiKey = ApiKey.loadFromDb(dbProps);
    const renamed = apiKey.withName("Renamed");
    expect(renamed).not.toBe(apiKey);
    expect(renamed.name).toBe("Renamed");
    expect(renamed.id).toBe(apiKey.id);
    expect(apiKey.name).toBe("CI pipeline");
  });

  it("toPlain returns all props", () => {
    expect(ApiKey.loadFromDb(dbProps).toPlain()).toEqual(dbProps);
  });

  it("cannot be mutated through Date references", () => {
    const input = {
      ...dbProps,
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
      createdAt: new Date("2026-08-21T00:00:00.000Z"),
    };
    const apiKey = ApiKey.loadFromDb(input);

    input.expiresAt.setFullYear(1999);
    apiKey.expiresAt!.setFullYear(1999);
    apiKey.createdAt.setFullYear(1999);
    (apiKey.toPlain().expiresAt as Date).setFullYear(1999);

    expect(apiKey.expiresAt).toEqual(new Date("2027-01-01T00:00:00.000Z"));
    expect(apiKey.createdAt).toEqual(new Date("2026-08-21T00:00:00.000Z"));
  });
});
