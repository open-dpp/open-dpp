import { describe, expect, it } from "vitest";
import { SignupFormSchema } from "./signup-form.ts";

describe("signupFormSchema", () => {
  const validInput = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    password: "securepass",
    passwordRepeat: "securepass",
  };

  it("should accept valid input", () => {
    const result = SignupFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should reject empty firstName", () => {
    const result = SignupFormSchema.safeParse({ ...validInput, firstName: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty lastName", () => {
    const result = SignupFormSchema.safeParse({ ...validInput, lastName: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const result = SignupFormSchema.safeParse({ ...validInput, email: "" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email format", () => {
    const result = SignupFormSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  const withPassword = (password: string) => ({
    ...validInput,
    password,
    passwordRepeat: password,
  });

  it("should reject password shorter than 8 characters", () => {
    const result = SignupFormSchema.safeParse(withPassword("short"));
    expect(result.success).toBe(false);
  });

  it("should reject password longer than 128 characters", () => {
    const result = SignupFormSchema.safeParse(withPassword("a".repeat(129)));
    expect(result.success).toBe(false);
  });

  it("should accept password with exactly 8 characters", () => {
    const result = SignupFormSchema.safeParse(withPassword("12345678"));
    expect(result.success).toBe(true);
  });

  it("should accept password with exactly 128 characters", () => {
    const result = SignupFormSchema.safeParse(withPassword("a".repeat(128)));
    expect(result.success).toBe(true);
  });

  it("should reject a repeated password that differs, with the error at the repeat field", () => {
    const result = SignupFormSchema.safeParse({ ...validInput, passwordRepeat: "securepasz" });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ code: "custom", path: ["passwordRepeat"] }),
    ]);
  });

  it("should reject an empty repeated password, with the error at the repeat field", () => {
    const result = SignupFormSchema.safeParse({ ...validInput, passwordRepeat: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ code: "custom", path: ["passwordRepeat"] }),
    ]);
  });

  it("should report a mismatch alongside other invalid fields", () => {
    const result = SignupFormSchema.safeParse({
      ...validInput,
      firstName: "",
      passwordRepeat: "other",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining([["firstName"], ["passwordRepeat"]]),
    );
  });

  it("should reject missing fields", () => {
    const result = SignupFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
