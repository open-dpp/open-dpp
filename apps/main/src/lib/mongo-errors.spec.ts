import { describe, expect, it } from "@jest/globals";

import { isDuplicateKeyError } from "./mongo-errors";

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
