import { describe, expect, it } from "@jest/globals";
import { ResendVerificationEmailDtoSchema } from "./resend-verification-email.dto";

describe("ResendVerificationEmailDtoSchema", () => {
  it("allows no callback path at all", () => {
    expect(ResendVerificationEmailDtoSchema.parse({})).toEqual({});
  });

  it("accepts a path of the application with a query", () => {
    const callbackPath = "/accept-guest-access/access-1?x=1";

    expect(ResendVerificationEmailDtoSchema.parse({ callbackPath })).toEqual({ callbackPath });
  });

  it("rejects everything which leads away from the application", () => {
    for (const callbackPath of [
      "https://evil.example.com/x",
      "//evil.example.com/x",
      "/\\evil.example.com",
      "accept-guest-access/access-1",
      "javascript:alert(1)",
      "",
      "/path\nwith-newline",
      `/${"a".repeat(3000)}`,
    ]) {
      expect(ResendVerificationEmailDtoSchema.safeParse({ callbackPath }).success).toBe(false);
    }
  });
});
