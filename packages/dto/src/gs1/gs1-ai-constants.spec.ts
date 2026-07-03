import { describe, expect, it } from "@jest/globals";
import * as fs from "node:fs";
import * as path from "node:path";
import { Gs1DataAttributeAi, Gs1KeyAi, Gs1QualifierAi } from "./gs1-ai-constants";
import { GS1_AI_TABLE } from "./gs1-ai-table";

const kinds = [
  { constants: Gs1KeyAi, type: "I", expectedCount: 14 },
  { constants: Gs1QualifierAi, type: "Q", expectedCount: 6 },
  { constants: Gs1DataAttributeAi, type: "D", expectedCount: 456 },
] as const;

/**
 * The naming rule, re-implemented independently of the generator script as a
 * drift guard: if either the vendored table or the generator changes without
 * regenerating (or the rule itself drifts), the deep-equality test fails.
 */
function expectedConstantsForType(type: "I" | "Q" | "D"): Record<string, string> {
  const entries = Object.values(GS1_AI_TABLE).filter((entry) => entry.type === type);
  const nameFromTitle = (title: string): string =>
    title
      .trim()
      .replace(/\([^)]*\)/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const name = nameFromTitle(entry.title);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const result: Record<string, string> = {};
  for (const entry of entries) {
    const base = nameFromTitle(entry.title);
    const name = (counts.get(base) ?? 0) > 1 ? `${base}_${entry.ai}` : base;
    result[name] = entry.ai;
  }
  return result;
}

describe("gs1-ai-constants", () => {
  it("partitions the full AI table into the three kinds (14 I + 6 Q + 456 D = 476)", () => {
    expect(Object.keys(Gs1KeyAi)).toHaveLength(14);
    expect(Object.keys(Gs1QualifierAi)).toHaveLength(6);
    expect(Object.keys(Gs1DataAttributeAi)).toHaveLength(456);
    expect(14 + 6 + 456).toBe(Object.keys(GS1_AI_TABLE).length);
  });

  it.each(kinds)(
    "values of the type-'$type' constants are exactly the table AIs of that type (bijection)",
    ({ constants, type }) => {
      const constantAis = Object.values(constants);
      const tableAis = Object.values(GS1_AI_TABLE)
        .filter((entry) => entry.type === type)
        .map((entry) => entry.ai);
      expect(new Set(constantAis).size).toBe(constantAis.length);
      expect([...constantAis].sort()).toEqual([...tableAis].sort());
    },
  );

  it.each(kinds)(
    "names of the type-'$type' constants are valid SCREAMING_SNAKE identifiers",
    ({ constants }) => {
      for (const name of Object.keys(constants)) {
        expect(name).toMatch(/^[A-Z][A-Z0-9_]*$/);
      }
    },
  );

  it.each(kinds)(
    "type-'$type' constants match the naming rule recomputed from the table (drift guard)",
    ({ constants, type }) => {
      expect({ ...constants }).toEqual(expectedConstantsForType(type));
    },
  );

  it("exposes the expected names for well-known AIs (spot checks)", () => {
    expect(Gs1KeyAi.GLOBAL_TRADE_ITEM_NUMBER).toBe("01");
    expect(Gs1KeyAi.SERIAL_SHIPPING_CONTAINER_CODE).toBe("00");
    expect(Gs1QualifierAi.BATCH_OR_LOT_NUMBER).toBe("10");
    expect(Gs1QualifierAi.SERIAL_NUMBER).toBe("21");
    expect(Gs1DataAttributeAi.PRODUCTION_DATE).toBe("11");
    expect(Gs1DataAttributeAi.EXPIRATION_DATE).toBe("17");
    expect(Gs1DataAttributeAi.NET_WEIGHT_KILOGRAMS_3103).toBe("3103");
    expect(Gs1DataAttributeAi.COMPANY_INTERNAL_INFORMATION_91).toBe("91");
    expect(Gs1DataAttributeAi.CERTIFICATION_REFERENCE_0).toBe("7230");
  });

  it("file text contains the provenance header", () => {
    const filePath = path.resolve(__dirname, "gs1-ai-constants.ts");
    const fileText = fs.readFileSync(filePath, "utf-8");
    expect(fileText).toContain("GS1DigitalLinkToolkit");
    expect(fileText).toContain("Apache-2.0");
  });
});
