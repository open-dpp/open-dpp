import { describe, expect, it } from "@jest/globals";
import {
  buildGs1DataAttributeQuery,
  buildGs1DigitalLink,
  Cset82ComponentSchema,
  formatGs1ElementString,
  GS1_CSET82_MAX_LENGTH,
  Gtin14Schema,
  GtinInputSchema,
  isGs1DataAttributeAi,
  isValidCset82Component,
  isValidGtinCheckDigit,
  isValidGs1DataAttributeValue,
  normalizeToGtin14,
} from "./gs1-digital-link";

// A GTIN-13 with a valid mod-10 check digit (a real example value: "Open" EAN-13 style).
// 4006381333931 is a canonical GS1 example GTIN-13.
const VALID_GTIN13 = "4006381333931";
const VALID_GTIN13_AS_14 = "04006381333931";
// GTIN-12 (UPC-A) canonical example with valid check digit.
const VALID_GTIN12 = "036000291452";
const VALID_GTIN12_AS_14 = "00036000291452";
// GTIN-8 canonical example with valid check digit.
const VALID_GTIN8 = "40170725";
const VALID_GTIN8_AS_14 = "00000040170725";
// GTIN-14 canonical example with valid check digit.
const VALID_GTIN14 = "00012345678905";

describe("isValidGtinCheckDigit", () => {
  it.each([VALID_GTIN8, VALID_GTIN12, VALID_GTIN13, VALID_GTIN14, VALID_GTIN13_AS_14])(
    "accepts a digit string with a correct mod-10 check digit: %s",
    (gtin) => {
      expect(isValidGtinCheckDigit(gtin)).toBe(true);
    },
  );

  it.each([
    "4006381333930", // last digit wrong
    "00012345678900", // wrong check digit
    "036000291451", // wrong check digit
  ])("rejects a digit string with an incorrect check digit: %s", (gtin) => {
    expect(isValidGtinCheckDigit(gtin)).toBe(false);
  });

  it("rejects non-digit input", () => {
    expect(isValidGtinCheckDigit("40063813A3393")).toBe(false);
    expect(isValidGtinCheckDigit("")).toBe(false);
  });
});

describe("normalizeToGtin14", () => {
  it.each([
    [VALID_GTIN8, VALID_GTIN8_AS_14],
    [VALID_GTIN12, VALID_GTIN12_AS_14],
    [VALID_GTIN13, VALID_GTIN13_AS_14],
    [VALID_GTIN14, VALID_GTIN14],
  ])("left-pads %s to GTIN-14 %s", (input, expected) => {
    expect(normalizeToGtin14(input)).toBe(expected);
  });

  it("trims surrounding whitespace before normalizing", () => {
    expect(normalizeToGtin14(`  ${VALID_GTIN13}  `)).toBe(VALID_GTIN13_AS_14);
  });

  it("throws on a length that is not a valid GTIN length", () => {
    expect(() => normalizeToGtin14("123456789")).toThrow(/length/i);
  });

  it("throws on a bad check digit", () => {
    expect(() => normalizeToGtin14("4006381333930")).toThrow(/check digit/i);
  });

  it("throws on non-digit characters", () => {
    expect(() => normalizeToGtin14("40063813A3393")).toThrow(/digit/i);
  });
});

describe("GtinInputSchema", () => {
  it("accepts a valid GTIN-13 and normalizes it to GTIN-14", () => {
    const result = GtinInputSchema.safeParse(VALID_GTIN13);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(VALID_GTIN13_AS_14);
    }
  });

  it("accepts a valid GTIN-14 unchanged", () => {
    const result = GtinInputSchema.safeParse(VALID_GTIN14);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(VALID_GTIN14);
    }
  });

  it("rejects a bad check digit with a clear message", () => {
    const result = GtinInputSchema.safeParse("4006381333930");
    expect(result.success).toBe(false);
  });

  it("rejects a wrong-length value", () => {
    const result = GtinInputSchema.safeParse("123456789");
    expect(result.success).toBe(false);
  });

  it("rejects non-digit input", () => {
    const result = GtinInputSchema.safeParse("40063813A3393");
    expect(result.success).toBe(false);
  });
});

describe("Gtin14Schema", () => {
  it("accepts a normalized 14-digit GTIN with a valid check digit", () => {
    expect(Gtin14Schema.safeParse(VALID_GTIN13_AS_14).success).toBe(true);
  });

  it("rejects a 13-digit value (must already be normalized)", () => {
    expect(Gtin14Schema.safeParse(VALID_GTIN13).success).toBe(false);
  });

  it("rejects a 14-digit value with a bad check digit", () => {
    expect(Gtin14Schema.safeParse("00012345678900").success).toBe(false);
  });
});

describe("buildGs1DigitalLink", () => {
  it("builds an uncompressed canonical Digital Link from a resolver base and GTIN-14", () => {
    const url = buildGs1DigitalLink("https://id.example.com", { gtin: VALID_GTIN13_AS_14 });
    expect(url).toBe(`https://id.example.com/01/${VALID_GTIN13_AS_14}`);
  });

  it("canonicalises the resolver base (drops a trailing slash, lowercases host)", () => {
    const url = buildGs1DigitalLink("https://ID.Example.com/", { gtin: VALID_GTIN13_AS_14 });
    expect(url).toBe(`https://id.example.com/01/${VALID_GTIN13_AS_14}`);
  });

  it("preserves a path segment on the resolver base", () => {
    const url = buildGs1DigitalLink("https://example.com/gs1", { gtin: VALID_GTIN13_AS_14 });
    expect(url).toBe(`https://example.com/gs1/01/${VALID_GTIN13_AS_14}`);
  });

  it("normalizes a non-14 GTIN before building", () => {
    const url = buildGs1DigitalLink("https://id.example.com", { gtin: VALID_GTIN13 });
    expect(url).toBe(`https://id.example.com/01/${VALID_GTIN13_AS_14}`);
  });

  it("throws on an invalid GTIN", () => {
    expect(() => buildGs1DigitalLink("https://id.example.com", { gtin: "123" })).toThrow();
  });

  it("appends a batch (AI 10) after the GTIN", () => {
    const url = buildGs1DigitalLink("https://id.example.com", {
      gtin: VALID_GTIN13_AS_14,
      batch: "LOT-42",
    });
    expect(url).toBe(`https://id.example.com/01/${VALID_GTIN13_AS_14}/10/LOT-42`);
  });

  it("appends a serial (AI 21) after the GTIN", () => {
    const url = buildGs1DigitalLink("https://id.example.com", {
      gtin: VALID_GTIN13_AS_14,
      serial: "SN-001",
    });
    expect(url).toBe(`https://id.example.com/01/${VALID_GTIN13_AS_14}/21/SN-001`);
  });

  it("lists present AIs in canonical order 01 -> 10 -> 21 when both batch and serial are set", () => {
    const url = buildGs1DigitalLink("https://id.example.com", {
      gtin: VALID_GTIN13_AS_14,
      serial: "SN-001",
      batch: "LOT-42",
    });
    expect(url).toBe(`https://id.example.com/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001`);
  });

  it("percent-encodes reserved characters in batch/serial path segments", () => {
    // '/' is reserved in CSET-82's percent-encoding set; it must be escaped so it
    // does not break the path structure.
    const url = buildGs1DigitalLink("https://id.example.com", {
      gtin: VALID_GTIN13_AS_14,
      serial: "A/B",
    });
    expect(url).toBe(`https://id.example.com/01/${VALID_GTIN13_AS_14}/21/A%2FB`);
  });

  it("ignores empty-string batch/serial (treated as absent)", () => {
    const url = buildGs1DigitalLink("https://id.example.com", {
      gtin: VALID_GTIN13_AS_14,
      batch: "",
      serial: "",
    });
    expect(url).toBe(`https://id.example.com/01/${VALID_GTIN13_AS_14}`);
  });

  it("throws on an over-length batch", () => {
    expect(() =>
      buildGs1DigitalLink("https://id.example.com", {
        gtin: VALID_GTIN13_AS_14,
        batch: "X".repeat(GS1_CSET82_MAX_LENGTH + 1),
      }),
    ).toThrow();
  });

  it("throws on a serial with a character outside CSET-82", () => {
    expect(() =>
      buildGs1DigitalLink("https://id.example.com", {
        gtin: VALID_GTIN13_AS_14,
        serial: "bad value", // space is not in CSET-82
      }),
    ).toThrow();
  });

  // Slice 6: dataAttributes threading

  it("produces byte-identical output with no dataAttributes (regression)", () => {
    const withoutField = buildGs1DigitalLink("https://id.example.com", {
      gtin: VALID_GTIN13_AS_14,
      batch: "LOT-42",
      serial: "SN-001",
    });
    const withUndefined = buildGs1DigitalLink("https://id.example.com", {
      gtin: VALID_GTIN13_AS_14,
      batch: "LOT-42",
      serial: "SN-001",
      dataAttributes: undefined,
    });
    expect(withUndefined).toBe(withoutField);
    expect(withoutField).toBe(
      `https://id.example.com/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001`,
    );
  });

  it("appends a single data-attribute query string after the serial segment", () => {
    const url = buildGs1DigitalLink("https://id.example.com", {
      gtin: VALID_GTIN13_AS_14,
      batch: "LOT-42",
      serial: "SN-001",
      dataAttributes: { "17": "251231" },
    });
    expect(url).toBe(
      `https://id.example.com/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001?17=251231`,
    );
  });

  it("appends multiple data-attribute pairs in canonical ascending-AI order", () => {
    const url = buildGs1DigitalLink("https://id.example.com", {
      gtin: VALID_GTIN13_AS_14,
      batch: "LOT-42",
      serial: "SN-001",
      dataAttributes: { "3103": "000189", "17": "251231" },
    });
    expect(url).toBe(
      `https://id.example.com/01/${VALID_GTIN13_AS_14}/10/LOT-42/21/SN-001?17=251231&3103=000189`,
    );
  });

  it("produces no query string for an empty dataAttributes object", () => {
    const url = buildGs1DigitalLink("https://id.example.com", {
      gtin: VALID_GTIN13_AS_14,
      dataAttributes: {},
    });
    expect(url).toBe(`https://id.example.com/01/${VALID_GTIN13_AS_14}`);
  });

  it("produces no query string for null dataAttributes", () => {
    const url = buildGs1DigitalLink("https://id.example.com", {
      gtin: VALID_GTIN13_AS_14,
      dataAttributes: null,
    });
    expect(url).toBe(`https://id.example.com/01/${VALID_GTIN13_AS_14}`);
  });

  it("query is always appended AFTER the serial segment (not before)", () => {
    const url = buildGs1DigitalLink("https://id.example.com", {
      gtin: VALID_GTIN13_AS_14,
      serial: "SN-001",
      dataAttributes: { "17": "251231" },
    });
    // Must end with ?17=251231 — query after /21/SN-001
    expect(url).toBe(`https://id.example.com/01/${VALID_GTIN13_AS_14}/21/SN-001?17=251231`);
  });

  it("throws when dataAttributes contains an unknown AI", () => {
    expect(() =>
      buildGs1DigitalLink("https://id.example.com", {
        gtin: VALID_GTIN13_AS_14,
        dataAttributes: { "9999": "123456" },
      }),
    ).toThrow();
  });

  it("throws when dataAttributes contains an invalid value for a known AI", () => {
    expect(() =>
      buildGs1DigitalLink("https://id.example.com", {
        gtin: VALID_GTIN13_AS_14,
        dataAttributes: { "17": "bad" },
      }),
    ).toThrow();
  });
});

describe("isValidCset82Component", () => {
  it.each(["SN-001", "LOT_42", "A.B", "abcXYZ0189", "%2A!\"&'()*+,/:;<=>?", "0", "x".repeat(20)])(
    "accepts a CSET-82 string of <= 20 chars: %s",
    (value) => {
      expect(isValidCset82Component(value)).toBe(true);
    },
  );

  it("rejects an empty string", () => {
    expect(isValidCset82Component("")).toBe(false);
  });

  it("rejects an over-length (> 20) string", () => {
    expect(isValidCset82Component("x".repeat(21))).toBe(false);
  });

  it.each(["with space", "tab\tchar", "emoji😀", "curly{brace}", "back\\slash", "tilde~"])(
    "rejects a string containing a character outside CSET-82: %s",
    (value) => {
      expect(isValidCset82Component(value)).toBe(false);
    },
  );
});

describe("Cset82ComponentSchema", () => {
  it("accepts a valid batch/serial component", () => {
    expect(Cset82ComponentSchema.safeParse("SN-001").success).toBe(true);
  });

  it("rejects an over-length value", () => {
    expect(Cset82ComponentSchema.safeParse("x".repeat(21)).success).toBe(false);
  });

  it("rejects an invalid charset value", () => {
    expect(Cset82ComponentSchema.safeParse("bad value").success).toBe(false);
  });

  it("rejects an empty value", () => {
    expect(Cset82ComponentSchema.safeParse("").success).toBe(false);
  });
});

describe("formatGs1ElementString", () => {
  it("formats a bare GTIN as a single (01) element", () => {
    expect(formatGs1ElementString({ gtin: VALID_GTIN13_AS_14 })).toBe(`(01) ${VALID_GTIN13_AS_14}`);
  });

  it("normalizes a non-14 GTIN before formatting", () => {
    expect(formatGs1ElementString({ gtin: VALID_GTIN13 })).toBe(`(01) ${VALID_GTIN13_AS_14}`);
  });

  it("appends a (10) batch element after the GTIN", () => {
    expect(formatGs1ElementString({ gtin: VALID_GTIN13_AS_14, batch: "LOT-42" })).toBe(
      `(01) ${VALID_GTIN13_AS_14} (10) LOT-42`,
    );
  });

  it("appends a (21) serial element after the GTIN", () => {
    expect(formatGs1ElementString({ gtin: VALID_GTIN13_AS_14, serial: "SN-001" })).toBe(
      `(01) ${VALID_GTIN13_AS_14} (21) SN-001`,
    );
  });

  it("lists present AIs in canonical order (01) (10) (21)", () => {
    expect(
      formatGs1ElementString({
        gtin: VALID_GTIN13_AS_14,
        serial: "SN-001",
        batch: "LOT-42",
      }),
    ).toBe(`(01) ${VALID_GTIN13_AS_14} (10) LOT-42 (21) SN-001`);
  });

  it("does not percent-encode batch/serial (human-readable, unlike the Digital Link)", () => {
    expect(formatGs1ElementString({ gtin: VALID_GTIN13_AS_14, serial: "A/B" })).toBe(
      `(01) ${VALID_GTIN13_AS_14} (21) A/B`,
    );
  });

  it("treats an empty-string batch/serial as absent", () => {
    expect(formatGs1ElementString({ gtin: VALID_GTIN13_AS_14, batch: "", serial: "" })).toBe(
      `(01) ${VALID_GTIN13_AS_14}`,
    );
  });

  it("treats a null batch/serial as absent", () => {
    expect(formatGs1ElementString({ gtin: VALID_GTIN13_AS_14, batch: null, serial: null })).toBe(
      `(01) ${VALID_GTIN13_AS_14}`,
    );
  });

  it("throws on an invalid GTIN", () => {
    expect(() => formatGs1ElementString({ gtin: "123" })).toThrow();
  });

  it("throws on a batch outside CSET-82 / over length", () => {
    expect(() =>
      formatGs1ElementString({
        gtin: VALID_GTIN13_AS_14,
        batch: "X".repeat(GS1_CSET82_MAX_LENGTH + 1),
      }),
    ).toThrow();
  });
});

describe("isGs1DataAttributeAi", () => {
  it("returns true for known data-attribute (type D) AIs", () => {
    expect(isGs1DataAttributeAi("17")).toBe(true);
    expect(isGs1DataAttributeAi("3103")).toBe(true);
    expect(isGs1DataAttributeAi("11")).toBe(true);
  });

  it("returns false for key identifier AIs (type I)", () => {
    expect(isGs1DataAttributeAi("01")).toBe(false);
  });

  it("returns false for key qualifier AIs (type Q)", () => {
    expect(isGs1DataAttributeAi("10")).toBe(false);
    expect(isGs1DataAttributeAi("21")).toBe(false);
  });

  it("returns false for unknown AIs", () => {
    expect(isGs1DataAttributeAi("9999")).toBe(false);
  });

  it("returns false for junk input", () => {
    expect(isGs1DataAttributeAi("abc")).toBe(false);
    expect(isGs1DataAttributeAi("")).toBe(false);
    expect(isGs1DataAttributeAi(" 17")).toBe(false);
  });

  it("does not mutate input", () => {
    const ai = "17";
    const snapshot = ai;
    isGs1DataAttributeAi(ai);
    expect(ai).toBe(snapshot);
  });
});

describe("isValidGs1DataAttributeValue", () => {
  // AI "17" — Expiration date, N6 (fixed-length 6 digits)
  it('accepts a valid value for AI "17" (fixed-length 6 digits)', () => {
    expect(isValidGs1DataAttributeValue("17", "251231")).toBe(true);
  });

  it('rejects a too-short value for AI "17"', () => {
    expect(isValidGs1DataAttributeValue("17", "25123")).toBe(false);
  });

  it('rejects a too-long value for AI "17"', () => {
    expect(isValidGs1DataAttributeValue("17", "2512311")).toBe(false);
  });

  it('rejects a non-numeric value for AI "17"', () => {
    expect(isValidGs1DataAttributeValue("17", "2512AB")).toBe(false);
  });

  // AI "3103" — Net weight, kilograms, N6 (fixed-length 6 digits)
  it('accepts a valid value for AI "3103" (fixed-length 6 digits)', () => {
    expect(isValidGs1DataAttributeValue("3103", "000189")).toBe(true);
  });

  it('rejects a too-short value for AI "3103"', () => {
    expect(isValidGs1DataAttributeValue("3103", "18")).toBe(false);
  });

  it('rejects a non-numeric value for AI "3103"', () => {
    expect(isValidGs1DataAttributeValue("3103", "abcdef")).toBe(false);
  });

  // AI "240" — Additional product identification, X..30 (variable-length CSET-82, up to 30 chars)
  it('accepts an in-range CSET-82 string for AI "240" (variable-length)', () => {
    expect(isValidGs1DataAttributeValue("240", "PART-ABC-123")).toBe(true);
  });

  it('rejects an over-length value for AI "240" (> 30 chars)', () => {
    expect(isValidGs1DataAttributeValue("240", "X".repeat(31))).toBe(false);
  });

  it('rejects an out-of-charset value for AI "240" (space not in regex charset)', () => {
    expect(isValidGs1DataAttributeValue("240", "has space")).toBe(false);
  });

  // Edge cases
  it("returns false for an unknown AI", () => {
    expect(isValidGs1DataAttributeValue("9999", "anything")).toBe(false);
  });

  it("returns false for a key qualifier AI (type Q)", () => {
    expect(isValidGs1DataAttributeValue("21", "SN001")).toBe(false);
  });

  it("returns false for an empty value", () => {
    expect(isValidGs1DataAttributeValue("17", "")).toBe(false);
  });
});

describe("buildGs1DataAttributeQuery", () => {
  it("returns empty string for undefined input", () => {
    expect(buildGs1DataAttributeQuery(undefined)).toBe("");
  });

  it("returns empty string for null input", () => {
    expect(buildGs1DataAttributeQuery(null)).toBe("");
  });

  it("returns empty string for empty object", () => {
    expect(buildGs1DataAttributeQuery({})).toBe("");
  });

  it("builds a single-key query string with leading ?", () => {
    expect(buildGs1DataAttributeQuery({ "17": "251231" })).toBe("?17=251231");
  });

  it("builds a multi-key query string in ascending AI order", () => {
    expect(buildGs1DataAttributeQuery({ "17": "251231", "3103": "000189" })).toBe(
      "?17=251231&3103=000189",
    );
  });

  it("produces the same string regardless of insertion order (ascending AI sort)", () => {
    // Insert in reverse order: "3103" before "17"
    const reverseOrder: Record<string, string> = {};
    reverseOrder["3103"] = "000189";
    reverseOrder["17"] = "251231";
    expect(buildGs1DataAttributeQuery(reverseOrder)).toBe("?17=251231&3103=000189");
  });

  it("percent-encodes values with reserved characters (e.g. '/' → '%2F')", () => {
    // AI "240" is X..30 (variable-length CSET-82) — valid, can contain '/'
    expect(buildGs1DataAttributeQuery({ "240": "A/B" })).toBe("?240=A%2FB");
  });

  it("throws on an unknown AI key", () => {
    expect(() => buildGs1DataAttributeQuery({ "9999": "123456" })).toThrow();
  });

  it("throws on an invalid value for a known data-attribute AI", () => {
    expect(() => buildGs1DataAttributeQuery({ "17": "bad" })).toThrow();
  });
});
