/**
 * Slice 7 — Barrel-export test.
 *
 * Imports from the **package root** (`@open-dpp/dto`) and asserts that
 * the GS1 data-attributes schema and helpers are reachable from there.
 */
import { describe, expect, it } from "@jest/globals";

// Import from the package root barrel (not the individual module).
import {
  Gs1DataAttributesSchema,
  isGs1DataAttributeAi,
  isValidGs1DataAttributeValue,
  buildGs1DataAttributeQuery,
} from "../index";
import type { Gs1DataAttributes } from "../index";

describe("gs1-data-attributes barrel export (Slice 7)", () => {
  it("Gs1DataAttributesSchema is exported from the package root and is an object with safeParse", () => {
    expect(typeof Gs1DataAttributesSchema).toBe("object");
    expect(typeof Gs1DataAttributesSchema.safeParse).toBe("function");
  });

  it("isGs1DataAttributeAi is exported from the package root and is a function", () => {
    expect(typeof isGs1DataAttributeAi).toBe("function");
  });

  it("isValidGs1DataAttributeValue is exported from the package root and is a function", () => {
    expect(typeof isValidGs1DataAttributeValue).toBe("function");
  });

  it("buildGs1DataAttributeQuery is exported from the package root and is a function", () => {
    expect(typeof buildGs1DataAttributeQuery).toBe("function");
  });

  it("type Gs1DataAttributes resolves (compile-time check via assignment)", () => {
    // This is a compile-time type assertion: if Gs1DataAttributes did not export correctly,
    // TypeScript would reject the assignment below.
    const attrs: Gs1DataAttributes = { "17": "251231" };
    expect(attrs).toEqual({ "17": "251231" });
  });

  it("the exported symbols behave correctly (smoke-test)", () => {
    // isGs1DataAttributeAi
    expect(isGs1DataAttributeAi("17")).toBe(true);
    expect(isGs1DataAttributeAi("01")).toBe(false);

    // isValidGs1DataAttributeValue
    expect(isValidGs1DataAttributeValue("17", "251231")).toBe(true);
    expect(isValidGs1DataAttributeValue("17", "bad")).toBe(false);

    // buildGs1DataAttributeQuery
    expect(buildGs1DataAttributeQuery({ "17": "251231" })).toBe("?17=251231");
    expect(buildGs1DataAttributeQuery({})).toBe("");
    expect(buildGs1DataAttributeQuery(null)).toBe("");

    // Gs1DataAttributesSchema
    const result = Gs1DataAttributesSchema.safeParse({ "17": "251231" });
    expect(result.success).toBe(true);
  });
});
