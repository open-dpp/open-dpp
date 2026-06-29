import type { UserDto } from "@open-dpp/dto";
import { Language } from "@open-dpp/dto";
import { describe, expect, it } from "vitest";
import { computeProfileDiff, mapUserToFormValues, type ProfileFormValues } from "./profile-form.ts";

const baseUser: UserDto = {
  id: "user-1",
  email: "user@example.com",
  firstName: "Jane",
  lastName: "Roe",
  name: "Jane Roe",
  image: null,
  emailVerified: true,
  preferredLanguage: Language.en,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const baseFormValues: ProfileFormValues = {
  firstName: "Jane",
  lastName: "Roe",
  email: "user@example.com",
  preferredLanguage: Language.en,
};

describe("mapUserToFormValues", () => {
  it("maps a populated user to form values", () => {
    expect(mapUserToFormValues(baseUser)).toEqual({
      firstName: "Jane",
      lastName: "Roe",
      email: "user@example.com",
      preferredLanguage: Language.en,
    });
  });

  it("converts null firstName/lastName to empty strings", () => {
    const result = mapUserToFormValues({ ...baseUser, firstName: null, lastName: null });
    expect(result.firstName).toBe("");
    expect(result.lastName).toBe("");
  });

  it("falls back to Language.en when preferredLanguage is missing", () => {
    const result = mapUserToFormValues({
      ...baseUser,
      preferredLanguage: undefined as unknown as typeof baseUser.preferredLanguage,
    });
    expect(result.preferredLanguage).toBe(Language.en);
  });
});

describe("computeProfileDiff", () => {
  it("returns an empty diff when nothing changed", () => {
    expect(computeProfileDiff(baseFormValues, baseFormValues)).toEqual({});
  });

  it("includes only firstName when only firstName changed", () => {
    const diff = computeProfileDiff({ ...baseFormValues, firstName: "Janet" }, baseFormValues);
    expect(diff).toEqual({ firstName: "Janet" });
  });

  it("includes only lastName when only lastName changed", () => {
    const diff = computeProfileDiff({ ...baseFormValues, lastName: "Smith" }, baseFormValues);
    expect(diff).toEqual({ lastName: "Smith" });
  });

  it("includes only preferredLanguage when only language changed", () => {
    const diff = computeProfileDiff(
      { ...baseFormValues, preferredLanguage: Language.de },
      baseFormValues,
    );
    expect(diff).toEqual({ preferredLanguage: Language.de });
  });

  it("includes all changed fields when multiple changed", () => {
    const diff = computeProfileDiff(
      {
        ...baseFormValues,
        firstName: "Janet",
        lastName: "Smith",
        preferredLanguage: Language.de,
      },
      baseFormValues,
    );
    expect(diff).toEqual({
      firstName: "Janet",
      lastName: "Smith",
      preferredLanguage: Language.de,
    });
  });

  it("excludes empty firstName even if different from original (treats empty as no-change)", () => {
    const diff = computeProfileDiff({ ...baseFormValues, firstName: "" }, baseFormValues);
    expect(diff).toEqual({});
  });

  it("excludes empty lastName even if different from original", () => {
    const diff = computeProfileDiff({ ...baseFormValues, lastName: "" }, baseFormValues);
    expect(diff).toEqual({});
  });

  it("ignores email field (handled by separate flow)", () => {
    const diff = computeProfileDiff(
      { ...baseFormValues, email: "different@example.com" },
      baseFormValues,
    );
    expect(diff).toEqual({});
  });

  it("accepts undefined firstName/lastName/preferredLanguage from vee-validate's loose form values", () => {
    const diff = computeProfileDiff({ email: baseFormValues.email }, baseFormValues);
    expect(diff).toEqual({});
  });
});
