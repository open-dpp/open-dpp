import { describe, expect, it } from "@jest/globals";
import { getGs1AiDescription } from "./gs1-ai-description";
import { GS1_AI_I18N, type Gs1AiI18nEntry } from "./gs1-ai-i18n";

/** Wide view so specs can iterate entries without literal-key unions. */
const I18N: Readonly<Record<string, Gs1AiI18nEntry>> = GS1_AI_I18N;

describe("getGs1AiDescription", () => {
  it("resolves an exact AI key", () => {
    expect(getGs1AiDescription("01", "en")).toBe("Global Trade Item Number (GTIN)");
    expect(getGs1AiDescription("01", "de")).toBe("Global Trade Item Number (GTIN)");
    expect(getGs1AiDescription("17", "de")).toBe("Verfallsdatum (JJMMTT)");
  });

  it("collapses decimal-place family AIs to their 'n' key", () => {
    // 3900-3909 share the "390n" row; 3103 shares "310n".
    const de390 = getGs1AiDescription("3902", "de");
    expect(de390).toBeDefined();
    expect(de390).toBe(getGs1AiDescription("3907", "de"));
    expect(getGs1AiDescription("3103", "de")).toBe(
      "Nettogewicht, Kilogramm (Mengenvariable Einheiten)",
    );
  });

  it("collapses sequence family AIs to their 'n' or 's' key", () => {
    // 7230-7239 share "723n"; 7030-7039 share "703s".
    expect(getGs1AiDescription("7231", "de")).toBe("Zertifizierungsnummer");
    expect(getGs1AiDescription("7031", "de")).toBeDefined();
    expect(getGs1AiDescription("7031", "de")).toBe(getGs1AiDescription("7039", "de"));
  });

  it("resolves company-internal AIs 91-99 via the range key", () => {
    const en91 = getGs1AiDescription("91", "en");
    expect(en91).toBeDefined();
    expect(getGs1AiDescription("99", "en")).toBe(en91);
    // 90 is published as its own row, not part of the range.
    expect(getGs1AiDescription("90", "en")).toBeDefined();
    expect(getGs1AiDescription("90", "en")).not.toBe(en91);
  });

  it("falls back to English when the language cell is untranslated", () => {
    // Generator invariant: every vendored row has en. For each directly-keyed
    // AI row, de resolution must yield the de cell when present, else en.
    const rows = Object.entries(I18N).filter(([key]) => /^\d{2,4}$/.test(key));
    expect(rows.length).toBeGreaterThan(50);
    for (const [ai, entry] of rows) {
      expect(getGs1AiDescription(ai, "de")).toBe(entry.de ?? entry.en);
      expect(getGs1AiDescription(ai, "en")).toBe(entry.en);
    }
  });

  it("returns undefined for unknown or non-AI input", () => {
    expect(getGs1AiDescription("0000", "en")).toBeUndefined();
    expect(getGs1AiDescription("", "en")).toBeUndefined();
    expect(getGs1AiDescription("not-an-ai", "de")).toBeUndefined();
    expect(getGs1AiDescription("1", "en")).toBeUndefined();
  });

  it("never resolves an AI to a UI string key (note-*/nav-* rows are excluded)", () => {
    // The generator drops non-AI rows entirely; sanity-check via a key that
    // exists upstream only as a nav-* string.
    expect(getGs1AiDescription("nav-All", "en")).toBeUndefined();
  });
});
