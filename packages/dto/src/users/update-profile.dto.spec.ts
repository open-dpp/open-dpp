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

  it("accepts an empty firstName (cleared name)", () => {
    const result = UpdateProfileDtoSchema.safeParse({ firstName: "" });
    expect(result.success).toBe(true);
  });

  it("rejects a firstName longer than 100 characters", () => {
    const result = UpdateProfileDtoSchema.safeParse({ firstName: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts a firstName of exactly 100 characters", () => {
    const result = UpdateProfileDtoSchema.safeParse({ firstName: "a".repeat(100) });
    expect(result.success).toBe(true);
  });

  it("accepts a valid lastName", () => {
    const result = UpdateProfileDtoSchema.safeParse({ lastName: "Doe" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty lastName (cleared name)", () => {
    const result = UpdateProfileDtoSchema.safeParse({ lastName: "" });
    expect(result.success).toBe(true);
  });

  it("rejects a lastName longer than 100 characters", () => {
    const result = UpdateProfileDtoSchema.safeParse({ lastName: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts a lastName of exactly 100 characters", () => {
    const result = UpdateProfileDtoSchema.safeParse({ lastName: "a".repeat(100) });
    expect(result.success).toBe(true);
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
    const result = UpdateProfileDtoSchema.safeParse({ preferredLanguage: "kl" });
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

  it("collapses whitespace-only firstName to an empty (cleared) name", () => {
    const parsed = UpdateProfileDtoSchema.parse({ firstName: "   " });
    expect(parsed.firstName).toBe("");
  });

  it("trims surrounding whitespace from firstName", () => {
    const parsed = UpdateProfileDtoSchema.parse({ firstName: "  Florian  " });
    expect(parsed.firstName).toBe("Florian");
  });

  it("collapses whitespace-only lastName to an empty (cleared) name", () => {
    const parsed = UpdateProfileDtoSchema.parse({ lastName: "   " });
    expect(parsed.lastName).toBe("");
  });

  it("trims surrounding whitespace from lastName", () => {
    const parsed = UpdateProfileDtoSchema.parse({ lastName: "  Bieck  " });
    expect(parsed.lastName).toBe("Bieck");
  });
});
