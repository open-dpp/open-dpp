import { describe, expect, it } from "@jest/globals";
import { Gs1DataAttributeAi, Gs1KeyAi, Gs1QualifierAi } from "./gs1-ai-constants";
import { GS1_AI_TABLE, type Gs1AiTableEntry } from "./gs1-ai-table";

const TABLE: Readonly<Record<string, Gs1AiTableEntry>> = GS1_AI_TABLE;
const ENTRIES = Object.values(TABLE);

const aisOfType = (type: Gs1AiTableEntry["type"]): string[] =>
  ENTRIES.filter((e) => e.type === type)
    .map((e) => e.ai)
    .sort();

/**
 * Independent reimplementation of the documented naming rule, used as an
 * oracle: title -> trim -> strip parentheticals -> uppercase -> collapse
 * non-alphanumeric runs to "_" -> strip edge "_"; same-name collisions within
 * a kind get a `_<AI>` suffix.
 */
const deriveNames = (entries: Gs1AiTableEntry[]): Map<string, string> => {
  const byName = new Map<string, string[]>();
  for (const entry of entries) {
    const name = entry.title
      .trim()
      .replace(/\([^)]*\)/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    byName.set(name, [...(byName.get(name) ?? []), entry.ai]);
  }
  const byAi = new Map<string, string>();
  for (const [name, ais] of byName) {
    for (const ai of ais) {
      byAi.set(ai, ais.length === 1 ? name : `${name}_${ai}`);
    }
  }
  return byAi;
};

describe("gs1-ai-constants (generated from the AI table — ADR 0002)", () => {
  const kinds: [string, Record<string, string>, Gs1AiTableEntry["type"]][] = [
    ["Gs1KeyAi", Gs1KeyAi, "I"],
    ["Gs1QualifierAi", Gs1QualifierAi, "Q"],
    ["Gs1DataAttributeAi", Gs1DataAttributeAi, "D"],
  ];

  it.each(kinds)("%s covers exactly the table AIs of its type", (_, obj, type) => {
    expect(Object.values(obj).sort()).toEqual(aisOfType(type));
  });

  it.each(kinds)("%s member names follow the documented naming rule", (_, obj, type) => {
    const expected = deriveNames(ENTRIES.filter((e) => e.type === type));
    const actual = new Map(Object.entries(obj).map(([name, ai]) => [ai, name]));
    for (const [ai, name] of expected) {
      expect(actual.get(ai)).toBe(name);
    }
  });

  it("element-string-only AIs (type N) appear in no constants kind", () => {
    const all = new Set<string>([
      ...Object.values(Gs1KeyAi),
      ...Object.values(Gs1QualifierAi),
      ...Object.values(Gs1DataAttributeAi),
    ]);
    for (const ai of aisOfType("N")) {
      expect(all.has(ai)).toBe(false);
    }
  });

  describe("spot checks", () => {
    it("keeps the load-bearing member names stable", () => {
      expect(Gs1KeyAi.GLOBAL_TRADE_ITEM_NUMBER).toBe("01");
      expect(Gs1KeyAi.SERIAL_SHIPPING_CONTAINER_CODE).toBe("00");
      expect(Gs1QualifierAi.BATCH_OR_LOT_NUMBER).toBe("10");
      expect(Gs1QualifierAi.SERIAL_NUMBER).toBe("21");
      expect(Gs1DataAttributeAi.EXPIRATION_DATE).toBe("17");
    });

    it("classifies GMN (8013) as a key, not a data attribute", () => {
      expect(Gs1KeyAi.GLOBAL_MODEL_NUMBER).toBe("8013");
      expect(Object.values(Gs1DataAttributeAi)).not.toContain("8013");
    });
  });
});
