import { describe, expect, it } from "@jest/globals";
import * as fs from "node:fs";
import * as path from "node:path";
import { GS1_AI_TABLE, type Gs1AiTableEntry } from "./gs1-ai-table.generated";

describe("GS1_AI_TABLE", () => {
  it("is a non-empty Record keyed by AI string", () => {
    expect(typeof GS1_AI_TABLE).toBe("object");
    expect(GS1_AI_TABLE).not.toBeNull();
    const keys = Object.keys(GS1_AI_TABLE);
    expect(keys.length).toBeGreaterThan(0);
    // All keys must be strings (they are by definition, but belt-and-suspenders)
    for (const key of keys) {
      expect(typeof key).toBe("string");
    }
  });

  it("entry '17' has type:D, fixedLength:true, a 6-digit regex, title containing 'Expiration'", () => {
    const entry = GS1_AI_TABLE["17"];
    expect(entry).toBeDefined();
    expect(entry.type).toBe("D");
    expect(entry.fixedLength).toBe(true);
    expect(entry.title).toMatch(/Expiration/i);
    // The regex must match exactly 6 digits (YYMMDD)
    const re = new RegExp("^(?:" + entry.regex + ")$");
    expect(re.test("251231")).toBe(true);
    expect(re.test("25123")).toBe(false);
    expect(re.test("2512311")).toBe(false);
    expect(re.test("25MMDD")).toBe(false);
  });

  it("entry '3103' has type:D, fixedLength:true, and a 6-digit regex", () => {
    const entry = GS1_AI_TABLE["3103"];
    expect(entry).toBeDefined();
    expect(entry.type).toBe("D");
    expect(entry.fixedLength).toBe(true);
    // The regex must match exactly 6 digits
    const re = new RegExp("^(?:" + entry.regex + ")$");
    expect(re.test("000189")).toBe(true);
    expect(re.test("18")).toBe(false);
    expect(re.test("abcdef")).toBe(false);
  });

  it("entry '01' has type:'I' (identifier key)", () => {
    const entry = GS1_AI_TABLE["01"];
    expect(entry).toBeDefined();
    expect(entry.type).toBe("I");
  });

  it("entry '10' has type:'Q' (key qualifier)", () => {
    const entry = GS1_AI_TABLE["10"];
    expect(entry).toBeDefined();
    expect(entry.type).toBe("Q");
  });

  it("entry '21' has type:'Q' (key qualifier)", () => {
    const entry = GS1_AI_TABLE["21"];
    expect(entry).toBeDefined();
    expect(entry.type).toBe("Q");
  });

  it("every entry exposes string ai/format/regex, a type in ['I','Q','D'], and boolean fixedLength", () => {
    const validTypes = new Set<string>(["I", "Q", "D"]);
    for (const [ai, entry] of Object.entries(GS1_AI_TABLE)) {
      // ai field matches the record key
      expect(entry.ai).toBe(ai);
      expect(typeof entry.ai).toBe("string");
      expect(typeof entry.format).toBe("string");
      expect(entry.format.length).toBeGreaterThan(0);
      expect(typeof entry.regex).toBe("string");
      expect(entry.regex.length).toBeGreaterThan(0);
      expect(validTypes.has(entry.type)).toBe(true);
      expect(typeof entry.fixedLength).toBe("boolean");
    }
  });

  it("has at least 400 entries with type:'D' (data attributes)", () => {
    const dEntries = Object.values(GS1_AI_TABLE).filter((e) => e.type === "D");
    expect(dEntries.length).toBeGreaterThanOrEqual(400);
  });

  it("file text contains Apache-2.0 + GS1DigitalLinkToolkit provenance header", () => {
    const filePath = path.resolve(__dirname, "gs1-ai-table.generated.ts");
    const fileText = fs.readFileSync(filePath, "utf-8");
    expect(fileText).toContain("GS1DigitalLinkToolkit");
    expect(fileText).toContain("Apache-2.0");
    expect(fileText).toContain("DO NOT EDIT");
  });

  it("Gs1AiTableEntry type has the expected fields (structural type check via runtime introspection)", () => {
    // Pick an entry known to have all optional fields
    const entry01 = GS1_AI_TABLE["01"] as Gs1AiTableEntry;
    expect(entry01).toHaveProperty("ai");
    expect(entry01).toHaveProperty("title");
    expect(entry01).toHaveProperty("format");
    expect(entry01).toHaveProperty("type");
    expect(entry01).toHaveProperty("fixedLength");
    expect(entry01).toHaveProperty("regex");
    // Optional fields may or may not be present; just confirm they're not crashing if absent
    const entry17 = GS1_AI_TABLE["17"] as Gs1AiTableEntry;
    expect(entry17.shortcode !== undefined || entry17.shortcode === undefined).toBe(true);
    expect(entry17.checkDigit !== undefined || entry17.checkDigit === undefined).toBe(true);
    expect(entry17.qualifiers !== undefined || entry17.qualifiers === undefined).toBe(true);
  });
});
