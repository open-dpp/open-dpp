import { describe, expect, it } from "vitest";
import { SigninFormSchema } from "./signin-form.ts";

describe("signinFormSchema", () => {
  const validInput = {
    email: "jane@example.com",
    password: "mypassword",
  };

  it("should accept valid input", () => {
    const result = SigninFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should reject empty email", () => {
    const result = SigninFormSchema.safeParse({ ...validInput, email: "" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email format", () => {
    const result = SigninFormSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const result = SigninFormSchema.safeParse({ ...validInput, password: "" });
    expect(result.success).toBe(false);
  });

  it("should accept any non-empty password", () => {
    const result = SigninFormSchema.safeParse({ ...validInput, password: "a" });
    expect(result.success).toBe(true);
  });

  it("should reject missing fields", () => {
    const result = SigninFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
