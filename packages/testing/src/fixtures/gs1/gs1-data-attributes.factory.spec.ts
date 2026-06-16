import { Gs1DataAttributesSchema } from "@open-dpp/dto";
import { gs1DataAttributesPlainFactory } from "./gs1-data-attributes.factory";

describe("gs1DataAttributesPlainFactory", () => {
  it("build() produces a map that parses against Gs1DataAttributesSchema", () => {
    const result = gs1DataAttributesPlainFactory.build();
    expect(() => Gs1DataAttributesSchema.parse(result)).not.toThrow();
  });

  it("default build contains a non-key AI (e.g. '17') and no value for that key is invalid", () => {
    const result = gs1DataAttributesPlainFactory.build();
    const keys = Object.keys(result);
    expect(keys.length).toBeGreaterThan(0);
    // None of the keys should be a primary identifier / key qualifier
    expect(keys).not.toContain("01");
    expect(keys).not.toContain("10");
    expect(keys).not.toContain("21");
    // Default should include AI "17" (expiration date)
    expect(result).toHaveProperty("17");
    expect(result["17"]).toBe("251231");
  });

  it("transient override {entries:{'3103':'000189'}} produces exactly that map and parses", () => {
    const override = { "3103": "000189" };
    const result = gs1DataAttributesPlainFactory.build(
      {},
      { transient: { entries: override } },
    );
    expect(result).toEqual(override);
    expect(() => Gs1DataAttributesSchema.parse(result)).not.toThrow();
  });

  it("empty {} parses against Gs1DataAttributesSchema", () => {
    const result = gs1DataAttributesPlainFactory.build(
      {},
      { transient: { entries: {} } },
    );
    expect(result).toEqual({});
    expect(() => Gs1DataAttributesSchema.parse(result)).not.toThrow();
  });

  it("does not mutate input transients", () => {
    const transientEntries = { "17": "251231" };
    const original = { ...transientEntries };
    gs1DataAttributesPlainFactory.build({}, { transient: { entries: transientEntries } });
    expect(transientEntries).toEqual(original);
  });
});
