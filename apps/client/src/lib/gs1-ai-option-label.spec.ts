import { describe, expect, it } from "vitest";
import { GS1_AI_TABLE, type Gs1AiTableEntry } from "@open-dpp/dto";
import { gs1AiDescriptionOrTitle, gs1AiOptionLabel } from "./gs1-ai-option-label";

const expirationDate = GS1_AI_TABLE["17"] as Gs1AiTableEntry;

describe("gs1AiDescriptionOrTitle", () => {
  it("resolves the description in the requested language", () => {
    expect(gs1AiDescriptionOrTitle(expirationDate, "de")).toBe("Verfallsdatum (JJMMTT)");
    expect(gs1AiDescriptionOrTitle(expirationDate, "de-DE")).toBe("Verfallsdatum (JJMMTT)");
    expect(gs1AiDescriptionOrTitle(expirationDate, "en-US")).toBe("Expiration date (YYMMDD)");
  });

  it("falls back to English for languages without vendored GS1 translations", () => {
    expect(gs1AiDescriptionOrTitle(expirationDate, "fr-FR")).toBe("Expiration date (YYMMDD)");
  });

  it("falls back to the table title when no translation row exists", () => {
    const entry = { ai: "0000", title: "Synthetic title" } as Gs1AiTableEntry;
    expect(gs1AiDescriptionOrTitle(entry, "de")).toBe("Synthetic title");
  });
});

describe("gs1AiOptionLabel", () => {
  it("joins AI and localized description", () => {
    expect(gs1AiOptionLabel(expirationDate, "de-DE")).toBe("17 — Verfallsdatum (JJMMTT)");
    expect(gs1AiOptionLabel(expirationDate, "fr")).toBe("17 — Expiration date (YYMMDD)");
  });
});
