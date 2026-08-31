import { describe, expect, it } from "@jest/globals";

import { isDuplicateKeyError, isDuplicateKeyErrorOnField } from "./mongo-errors";

describe("isDuplicateKeyError", () => {
  it("detects a duplicate-key error nested at a non-first writeErrors index", () => {
    const bulkError = {
      writeErrors: [{ code: 121 }, { code: 11000 }],
    };

    expect(isDuplicateKeyError(bulkError)).toBe(true);
  });

  it("detects a top-level duplicate-key code", () => {
    expect(isDuplicateKeyError({ code: 11000 })).toBe(true);
  });

  it("detects a duplicate-key code wrapped in a cause (transactional save)", () => {
    expect(isDuplicateKeyError({ cause: { code: 11000 } })).toBe(true);
  });

  it("detects a single-element writeErrors duplicate", () => {
    expect(isDuplicateKeyError({ writeErrors: [{ code: 11000 }] })).toBe(true);
  });

  it("returns false for a non-duplicate numeric code", () => {
    expect(isDuplicateKeyError({ code: 121 })).toBe(false);
  });

  it("returns false when no writeError carries the duplicate code", () => {
    expect(isDuplicateKeyError({ writeErrors: [{ code: 121 }, { code: 66 }] })).toBe(false);
  });

  it("treats a stringified code as not a duplicate (must be numeric)", () => {
    expect(isDuplicateKeyError({ code: "11000" })).toBe(false);
  });

  it.each([[null], [undefined], ["E11000 duplicate key"], [11000], [[]]])(
    "returns false for non-object error input %p",
    (input) => {
      expect(isDuplicateKeyError(input)).toBe(false);
    },
  );
});

describe("isDuplicateKeyErrorOnField", () => {
  it("matches when keyPattern names the field", () => {
    const error = { code: 11000, keyPattern: { uniqueProductIdentifierId: 1 } };
    expect(isDuplicateKeyErrorOnField(error, "uniqueProductIdentifierId")).toBe(true);
  });

  it("rejects a duplicate on a DIFFERENT index (the misattribution bug)", () => {
    const error = { code: 11000, keyPattern: { presentationConfigurationId: 1 } };
    expect(isDuplicateKeyErrorOnField(error, "uniqueProductIdentifierId")).toBe(false);
  });

  it("matches keyPattern nested in cause (transactional save)", () => {
    const error = { cause: { code: 11000, keyPattern: { slug: 1 } } };
    expect(isDuplicateKeyErrorOnField(error, "slug")).toBe(true);
  });

  it("falls back to the index name in the message when keyPattern is absent", () => {
    const error = {
      code: 11000,
      message:
        "E11000 duplicate key error collection: management.permalinks index: uniqueProductIdentifierId_1 dup key: { uniqueProductIdentifierId: null }",
    };
    expect(isDuplicateKeyErrorOnField(error, "uniqueProductIdentifierId")).toBe(true);
    expect(isDuplicateKeyErrorOnField(error, "presentationConfigurationId")).toBe(false);
  });

  it("returns false for a non-duplicate error even when keyPattern matches", () => {
    const error = { code: 121, keyPattern: { slug: 1 } };
    expect(isDuplicateKeyErrorOnField(error, "slug")).toBe(false);
  });

  it("returns false when neither keyPattern nor message identifies the index", () => {
    expect(isDuplicateKeyErrorOnField({ code: 11000 }, "slug")).toBe(false);
  });
});
