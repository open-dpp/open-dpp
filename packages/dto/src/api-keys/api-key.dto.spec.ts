import { describe, expect, it } from "@jest/globals";
import {
  ApiKeyDtoSchema,
  ApiKeyPaginationDtoSchema,
  CreateApiKeyDtoSchema,
  CreatedApiKeyDtoSchema,
  UpdateApiKeyDtoSchema,
} from "./api-key.dto";

const validApiKey = {
  id: "key-1",
  name: "CI pipeline",
  start: "opendpp_ab",
  expiresAt: "2027-01-01T00:00:00.000Z",
  lastUsedAt: null,
  createdAt: "2026-08-21T00:00:00.000Z",
};

describe("ApiKeyDtoSchema", () => {
  it("parses a full api key", () => {
    expect(ApiKeyDtoSchema.parse(validApiKey)).toEqual(validApiKey);
  });

  it("accepts null start, expiresAt and lastUsedAt", () => {
    const parsed = ApiKeyDtoSchema.parse({
      ...validApiKey,
      start: null,
      expiresAt: null,
      lastUsedAt: null,
    });
    expect(parsed.start).toBeNull();
    expect(parsed.expiresAt).toBeNull();
  });

  it("rejects a missing id", () => {
    const { id: _id, ...rest } = validApiKey;
    expect(() => ApiKeyDtoSchema.parse(rest)).toThrow();
  });
});

describe("CreateApiKeyDtoSchema", () => {
  it("requires a non-empty name", () => {
    expect(() => CreateApiKeyDtoSchema.parse({ name: "" })).toThrow();
    expect(CreateApiKeyDtoSchema.parse({ name: "My key" })).toEqual({ name: "My key" });
  });

  it("accepts only the expiry presets", () => {
    for (const days of [30, 90, 180, 365]) {
      expect(CreateApiKeyDtoSchema.parse({ name: "k", expiresInDays: days }).expiresInDays).toBe(
        days,
      );
    }
    expect(() => CreateApiKeyDtoSchema.parse({ name: "k", expiresInDays: 7 })).toThrow();
    expect(
      CreateApiKeyDtoSchema.parse({ name: "k", expiresInDays: null }).expiresInDays,
    ).toBeNull();
  });
});

describe("UpdateApiKeyDtoSchema", () => {
  it("requires a non-empty name", () => {
    expect(() => UpdateApiKeyDtoSchema.parse({ name: "" })).toThrow();
    expect(UpdateApiKeyDtoSchema.parse({ name: "Renamed" })).toEqual({ name: "Renamed" });
  });
});

describe("CreatedApiKeyDtoSchema", () => {
  it("includes the plain key exactly once at creation", () => {
    const parsed = CreatedApiKeyDtoSchema.parse({ ...validApiKey, key: "opendpp_secret" });
    expect(parsed.key).toBe("opendpp_secret");
  });
});

describe("ApiKeyPaginationDtoSchema", () => {
  it("parses a paginated result", () => {
    const parsed = ApiKeyPaginationDtoSchema.parse({
      paging_metadata: { cursor: null },
      result: [validApiKey],
    });
    expect(parsed.result).toHaveLength(1);
    expect(parsed.paging_metadata.cursor).toBeNull();
  });
});
