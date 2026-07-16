import { describe, expect, it } from "@jest/globals";
import { GS1_AI_TABLE, type Gs1AiTableEntry } from "./gs1-ai-table";

/** Wide view so specs can index with runtime strings regardless of literal keys. */
const TABLE: Readonly<Record<string, Gs1AiTableEntry>> = GS1_AI_TABLE;
const ENTRIES = Object.entries(TABLE);

/** Compile a table regex fragment the same way gs1-digital-link.ts does. */
const anchored = (fragment: string): RegExp => new RegExp(`^(?:${fragment})$`);

describe("GS1_AI_TABLE (generated from ref.gs1.org)", () => {
  it("contains the full ref.gs1.org AI registry (541 entries)", () => {
    expect(ENTRIES.length).toBe(541);
  });

  it("keys every entry by its own AI string", () => {
    for (const [key, entry] of ENTRIES) {
      expect(entry.ai).toBe(key);
    }
  });

  it("classifies every entry as I, Q, D, or N", () => {
    for (const [, entry] of ENTRIES) {
      expect(["I", "Q", "D", "N"]).toContain(entry.type);
    }
  });

  it("marks exactly the four element-string-only AIs as type N", () => {
    const nAis = ENTRIES.filter(([, e]) => e.type === "N").map(([ai]) => ai);
    expect(nAis.sort()).toEqual(["03", "7041", "8014", "8200"]);
  });

  it("compiles every regex fragment as an anchored RegExp", () => {
    for (const [, entry] of ENTRIES) {
      expect(() => anchored(entry.regex)).not.toThrow();
    }
  });

  it("carries no dropped legacy fields (shortcode, checkDigit)", () => {
    for (const [, entry] of ENTRIES) {
      expect(entry).not.toHaveProperty("shortcode");
      expect(entry).not.toHaveProperty("checkDigit");
    }
  });

  describe("spot checks against ref.gs1.org data", () => {
    it("GTIN (01) is a primary key with the strict N14 regex and DL qualifiers", () => {
      const gtin = TABLE["01"];
      expect(gtin).toBeDefined();
      expect(gtin.type).toBe("I");
      expect(gtin.title).toBe("Global Trade Item Number (GTIN)");
      expect(gtin.format).toBe("N14");
      expect(gtin.fixedLength).toBe(true);
      expect(gtin.regex).toBe("(\\d{14})");
      expect(gtin.qualifiers).toEqual(["22", "10", "21"]);
    });

    it("batch (10) is a variable-length qualifier", () => {
      const lot = TABLE["10"];
      expect(lot.type).toBe("Q");
      expect(lot.fixedLength).toBe(false);
      expect(lot.format).toBe("X..20");
    });

    it("GMN (8013) is a primary key, not a data attribute", () => {
      expect(TABLE["8013"].type).toBe("I");
    });

    it("payment slip reference (8020) is a qualifier", () => {
      expect(TABLE["8020"].type).toBe("Q");
    });

    it("extended packaging URL (8200) is element-string only", () => {
      expect(TABLE["8200"].type).toBe("N");
    });

    it("date AIs validate real months and days, not just six digits", () => {
      for (const ai of ["11", "12", "13", "15", "16", "17"]) {
        const rx = anchored(TABLE[ai].regex);
        expect(rx.test("260131")).toBe(true);
        expect(rx.test("999999")).toBe(false);
        expect(rx.test("261332")).toBe(false);
      }
    });
  });
});
