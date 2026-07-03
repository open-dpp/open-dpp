/**
 * Barrel-export smoke test: imports from the **package root** (`@open-dpp/dto`)
 * and exercises the GS1 data-attributes schema and helpers from there.
 */
import { describe, expect, it } from "@jest/globals";
import {
  GS1_AI_GTIN,
  GS1_AI_TABLE,
  Gs1DataAttributeAi,
  Gs1DataAttributesSchema,
  Gs1KeyAi,
  Gs1QualifierAi,
  isGs1DataAttributeAi,
  isValidGs1DataAttributeValue,
  buildGs1DataAttributeQuery,
} from "../index";
import type { Gs1DataAttributes } from "../index";

describe("gs1-data-attributes barrel export", () => {
  it("exports the schema, helpers, and type from the package root (smoke-test)", () => {
    // Compile-time type assertion: `pnpm check-ts` fails if the type is not
    // exported (jest/swc strips types and the build tsconfig excludes specs).
    const attrs: Gs1DataAttributes = { "17": "251231" };

    expect(isGs1DataAttributeAi("17")).toBe(true);
    expect(isGs1DataAttributeAi("01")).toBe(false);

    expect(isValidGs1DataAttributeValue("17", "251231")).toBe(true);
    expect(isValidGs1DataAttributeValue("17", "bad")).toBe(false);

    expect(buildGs1DataAttributeQuery(attrs)).toBe("?17=251231");
    expect(buildGs1DataAttributeQuery({})).toBe("");
    expect(buildGs1DataAttributeQuery(null)).toBe("");

    expect(Gs1DataAttributesSchema.safeParse(attrs).success).toBe(true);
  });

  it("exports the named AI constants and the vendored table from the package root", () => {
    expect(Gs1KeyAi.GLOBAL_TRADE_ITEM_NUMBER).toBe("01");
    expect(Gs1QualifierAi.BATCH_OR_LOT_NUMBER).toBe("10");
    expect(Gs1DataAttributeAi.EXPIRATION_DATE).toBe("17");
    expect(GS1_AI_GTIN).toBe(Gs1KeyAi.GLOBAL_TRADE_ITEM_NUMBER);
    // Table entries carry human-readable titles (used by UI pickers downstream).
    expect(GS1_AI_TABLE["17"].title).toBeTruthy();
  });
});
