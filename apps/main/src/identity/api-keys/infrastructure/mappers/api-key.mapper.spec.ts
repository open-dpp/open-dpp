import { ApiKeyMapper } from "./api-key.mapper";

describe("ApiKeyMapper", () => {
  const raw = {
    id: "key-1",
    name: "my key",
    start: "abc1",
    referenceId: "user-1",
    createdAt: "2026-08-23T10:00:00.000Z",
  };

  it("parses valid timestamp strings and Date instances", () => {
    const apiKey = ApiKeyMapper.toDomain({
      ...raw,
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
      lastRequest: "2026-08-22T09:00:00.000Z",
    });
    expect(apiKey.createdAt).toEqual(new Date("2026-08-23T10:00:00.000Z"));
    expect(apiKey.expiresAt).toEqual(new Date("2027-01-01T00:00:00.000Z"));
    expect(apiKey.lastUsedAt).toEqual(new Date("2026-08-22T09:00:00.000Z"));
  });

  it("maps invalid timestamp strings and non-date values to null", () => {
    const apiKey = ApiKeyMapper.toDomain({
      ...raw,
      expiresAt: "not-a-date",
      lastRequest: 12345,
    });
    expect(apiKey.expiresAt).toBeNull();
    expect(apiKey.lastUsedAt).toBeNull();
  });

  it("throws when createdAt is an invalid timestamp string", () => {
    expect(() => ApiKeyMapper.toDomain({ ...raw, createdAt: "not-a-date" })).toThrow(
      "Api key document is missing createdAt",
    );
  });
});
