import { describe, expect, it } from "@jest/globals";
import { GS1_AI_TABLE, type Gs1AiTableEntry } from "./gs1-ai-table";
import {
  buildGs1DataAttributeQuery,
  buildGs1DigitalLink,
  buildGs1DigitalLinkPath,
  Cset82ComponentInputSchema,
  Cset82ComponentSchema,
  GS1_DATA_ATTRIBUTE_MAX_LENGTH,
  isGs1DataAttributeAi,
  isValidCset82Component,
  isValidGs1DataAttributeValue,
} from "./gs1-digital-link";

const TABLE: Readonly<Record<string, Gs1AiTableEntry>> = GS1_AI_TABLE;

/**
 * Sum of the upper bounds of every quantifier in a regex fragment (`{n}` -> n,
 * `{n,m}` -> m). For the vendored type-'D' fragments — a single quantified class,
 * or a short concatenation of them — this is the maximum length of a raw
 * (branch-A) value the regex accepts, i.e. the GS1 "X..N" character ceiling.
 */
const maxRawValueLength = (regex: string): number => {
  let sum = 0;
  for (const [, single, upper] of regex.matchAll(/\{(\d+)(?:,(\d+))?\}/g)) {
    sum += Number(upper ?? single);
  }
  return sum;
};

const dataAttributeEntries = Object.values(TABLE).filter((e) => e.type === "D");

describe("isValidGs1DataAttributeValue — length guard (ReDoS)", () => {
  it("rejects an over-long ambiguous value fast instead of backtracking", () => {
    // AI 7256 ("Full name of person") uses the (single-char | %HH%HH){1,90}
    // fragment. Unguarded, ~120 chars of "%AA" pinned a core for seconds; the
    // length guard must reject this in constant time.
    const attack = "%AA".repeat(2000); // 6000 chars, ambiguous, cannot match
    const start = process.hrtime.bigint();
    const result = isValidGs1DataAttributeValue("7256", attack);
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;

    expect(result).toBe(false);
    expect(elapsedMs).toBeLessThan(250);
  });

  it("still accepts a valid value at the maximum allowed length", () => {
    const maxValue = "A".repeat(GS1_DATA_ATTRIBUTE_MAX_LENGTH);
    expect(isValidGs1DataAttributeValue("7256", maxValue)).toBe(true);
  });

  it("rejects a value one character past the cap", () => {
    const tooLong = "A".repeat(GS1_DATA_ATTRIBUTE_MAX_LENGTH + 1);
    expect(isValidGs1DataAttributeValue("7256", tooLong)).toBe(false);
  });

  it("still validates normal values by format (empty and content rules intact)", () => {
    expect(isValidGs1DataAttributeValue("17", "251231")).toBe(true); // valid YYMMDD
    expect(isValidGs1DataAttributeValue("17", "259999")).toBe(false); // impossible date
    expect(isValidGs1DataAttributeValue("17", "")).toBe(false); // empty
    expect(isValidGs1DataAttributeValue("01", "04006381333931")).toBe(false); // not a data attribute
    expect(isValidGs1DataAttributeValue("9999", "x")).toBe(false); // unknown AI
  });

  it("keeps the cap >= the longest value any data-attribute AI accepts", () => {
    // Invariant that survives table regeneration: if GS1 ever ships a longer AI,
    // this fails loudly so the cap (and the ReDoS reasoning) gets revisited.
    for (const entry of dataAttributeEntries) {
      expect(maxRawValueLength(entry.regex)).toBeLessThanOrEqual(GS1_DATA_ATTRIBUTE_MAX_LENGTH);
    }
  });
});

describe("dot-segment batch/serial values", () => {
  // "." and ".." are CSET-82 characters, but as full path segments every RFC
  // 3986 normalizer (browsers, new URL(), servers) collapses them before the
  // resolver sees the path — the link would silently resolve to a different
  // identity. Percent-encoding does not help ("%2E" forms are collapsed too).
  it("rejects '.' and '..' as components, keeps other dotted values", () => {
    expect(isValidCset82Component(".")).toBe(false);
    expect(isValidCset82Component("..")).toBe(false);
    expect(isValidCset82Component("...")).toBe(true);
    expect(isValidCset82Component("1.2.3")).toBe(true);
  });

  it("rejects '.' and '..' via the write-boundary schemas", () => {
    expect(Cset82ComponentSchema.safeParse(".").success).toBe(false);
    expect(Cset82ComponentSchema.safeParse("..").success).toBe(false);
    expect(Cset82ComponentInputSchema.safeParse("..").success).toBe(false);
    expect(Cset82ComponentSchema.safeParse("v1.2").success).toBe(true);
  });

  it("buildGs1DigitalLink refuses dot-segment batch/serial", () => {
    const gtin = "04006381333931";
    expect(() => buildGs1DigitalLink("https://r.example", { gtin, batch: ".." })).toThrow();
    expect(() => buildGs1DigitalLink("https://r.example", { gtin, serial: "." })).toThrow();
  });
});

describe("RFC 3986 canonical encoding", () => {
  // encodeURIComponent leaves the sub-delims !'()* raw; all four are CSET-82
  // characters, so links would vary by URL library without post-escaping.
  it("percent-encodes !'()* in batch/serial path segments", () => {
    const link = buildGs1DigitalLink("https://r.example", {
      gtin: "04006381333931",
      serial: "A!'()*B",
    });
    expect(link).toBe("https://r.example/01/04006381333931/21/A%21%27%28%29%2AB");
  });

  it("percent-encodes !'()* in data-attribute query values", () => {
    // AI 90 (X..30, CSET-82) accepts all four characters raw.
    expect(buildGs1DataAttributeQuery({ "90": "A!'()*B" })).toBe("?90=A%21%27%28%29%2AB");
  });
});

describe("buildGs1DigitalLinkPath", () => {
  it("builds the base-less canonical path with normalization and encoding", () => {
    expect(buildGs1DigitalLinkPath({ gtin: "4006381333931", batch: "LOT/1", serial: "SN-1" })).toBe(
      "01/04006381333931/10/LOT%2F1/21/SN-1",
    );
  });

  it("matches the path portion of buildGs1DigitalLink", () => {
    const parts = { gtin: "04006381333931", batch: "B(1)", serial: "S:1" };
    expect(buildGs1DigitalLink("https://r.example", parts)).toBe(
      `https://r.example/${buildGs1DigitalLinkPath(parts)}`,
    );
  });
});

describe("non-string input guards (plain-JS callers)", () => {
  it("isGs1DataAttributeAi rejects non-string AI keys", () => {
    expect(isGs1DataAttributeAi(17 as unknown as string)).toBe(false);
    expect(isGs1DataAttributeAi(undefined as unknown as string)).toBe(false);
  });

  it("isValidGs1DataAttributeValue rejects non-string AI or value", () => {
    expect(isValidGs1DataAttributeValue(17 as unknown as string, "251231")).toBe(false);
    expect(isValidGs1DataAttributeValue("17", 251231 as unknown as string)).toBe(false);
  });
});
