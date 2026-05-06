import { expect } from "@jest/globals";
import { UpdateProfileDtoSchema } from "./update-profile.dto";

describe("updateProfileDto", () => {
  it("accepts an empty object (all fields optional)", () => {
    const result = UpdateProfileDtoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts a valid firstName", () => {
    const result = UpdateProfileDtoSchema.safeParse({ firstName: "Jane" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty firstName", () => {
    const result = UpdateProfileDtoSchema.safeParse({ firstName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a firstName longer than 100 characters", () => {
    const result = UpdateProfileDtoSchema.safeParse({ firstName: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts a valid lastName", () => {
    const result = UpdateProfileDtoSchema.safeParse({ lastName: "Doe" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty lastName", () => {
    const result = UpdateProfileDtoSchema.safeParse({ lastName: "" });
    expect(result.success).toBe(false);
  });

  it("accepts preferredLanguage 'en'", () => {
    const result = UpdateProfileDtoSchema.safeParse({ preferredLanguage: "en" });
    expect(result.success).toBe(true);
  });

  it("accepts preferredLanguage 'de'", () => {
    const result = UpdateProfileDtoSchema.safeParse({ preferredLanguage: "de" });
    expect(result.success).toBe(true);
  });

  it("rejects an unsupported preferredLanguage", () => {
    const result = UpdateProfileDtoSchema.safeParse({ preferredLanguage: "fr" });
    expect(result.success).toBe(false);
  });

  it("accepts all fields together", () => {
    const result = UpdateProfileDtoSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      preferredLanguage: "de",
    });
    expect(result.success).toBe(true);
  });

  it("rejects whitespace-only firstName", () => {
    expect(() => UpdateProfileDtoSchema.parse({ firstName: "   " })).toThrow();
  });

  it("trims surrounding whitespace from firstName", () => {
    const parsed = UpdateProfileDtoSchema.parse({ firstName: "  Florian  " });
    expect(parsed.firstName).toBe("Florian");
  });

  it("rejects whitespace-only lastName", () => {
    expect(() => UpdateProfileDtoSchema.parse({ lastName: "   " })).toThrow();
  });

  it("trims surrounding whitespace from lastName", () => {
    const parsed = UpdateProfileDtoSchema.parse({ lastName: "  Bieck  " });
    expect(parsed.lastName).toBe("Bieck");
  });
});
