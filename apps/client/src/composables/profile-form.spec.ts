import type { UserDto } from "@open-dpp/dto";
import { Language } from "@open-dpp/dto";
import { describe, expect, it } from "vitest";
import {
  computeProfileDiff,
  mapUserToFormValues,
  mergeUpdatedUserIntoOriginal,
  shouldSubmitEmailChange,
  type ProfileFormValues,
} from "./profile-form.ts";

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

describe("mergeUpdatedUserIntoOriginal", () => {
  it("overwrites name and language fields with the updated user's values", () => {
    const updated: UserDto = {
      ...baseUser,
      firstName: "Janet",
      lastName: "Smith",
      preferredLanguage: Language.de,
    };

    const result = mergeUpdatedUserIntoOriginal(updated, baseFormValues);

    expect(result).toEqual({
      ...baseFormValues,
      firstName: "Janet",
      lastName: "Smith",
      preferredLanguage: Language.de,
    });
  });

  it("preserves original values when the update returns null fields", () => {
    const updated: UserDto = { ...baseUser, firstName: null, lastName: null };

    const result = mergeUpdatedUserIntoOriginal(updated, baseFormValues);

    expect(result.firstName).toBe(baseFormValues.firstName);
    expect(result.lastName).toBe(baseFormValues.lastName);
  });

  it("preserves the email field even though it cannot change via this flow", () => {
    const updated: UserDto = { ...baseUser, email: "new@example.com" };

    const result = mergeUpdatedUserIntoOriginal(updated, baseFormValues);

    expect(result.email).toBe(baseFormValues.email);
  });
});

describe("shouldSubmitEmailChange", () => {
  it("rejects an empty candidate", () => {
    expect(shouldSubmitEmailChange("", "user@example.com")).toBe(false);
  });

  it("rejects a candidate equal to the current email", () => {
    expect(shouldSubmitEmailChange("user@example.com", "user@example.com")).toBe(false);
  });

  it("accepts a candidate different from the current email", () => {
    expect(shouldSubmitEmailChange("new@example.com", "user@example.com")).toBe(true);
  });
});
