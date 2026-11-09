import { describe, expect, it } from "vitest";
import { BaseEmail } from "./base-email";
import { EmailTemplate } from "./email-template";

const mailWith = (properties: Record<string, unknown>) =>
  new BaseEmail(
    "test-id",
    "VERIFY_EMAIL",
    new EmailTemplate("email-verify.mjml", properties as never),
    "ada@example.com",
    "Verify E-Mail address",
  );

describe("BaseEmail.links", () => {
  it("returns the action links among the template properties, unescaped", () => {
    const mail = mailWith({
      firstName: "Ada",
      link: "https://app.open-dpp.test/verify-email?token=abc&callbackURL=%2F",
      revokeUrl: "http://localhost:3000/account/email-change-revoke?token=xyz",
    });

    expect(mail.links()).toEqual([
      "https://app.open-dpp.test/verify-email?token=abc&callbackURL=%2F",
      "http://localhost:3000/account/email-change-revoke?token=xyz",
    ]);
  });

  it("matches the URL scheme case-insensitively", () => {
    const mail = mailWith({
      link: "HTTPS://app.open-dpp.test/verify-email?token=abc",
      revokeUrl: "Http://localhost:3000/account/email-change-revoke?token=xyz",
    });

    expect(mail.links()).toEqual([
      "HTTPS://app.open-dpp.test/verify-email?token=abc",
      "Http://localhost:3000/account/email-change-revoke?token=xyz",
    ]);
  });

  it("ignores properties that are no URL", () => {
    const mail = mailWith({ firstName: "Ada", newEmail: "new@example.com", count: 3 });

    expect(mail.links()).toEqual([]);
  });

  it("leaves out display text that users set, even when it reads as a URL", () => {
    const mail = mailWith({
      firstName: "https://evil.test/first\nMail not sent (mail disabled): forged",
      organizationName: "https://evil.test/org",
      link: "https://app.open-dpp.test/accept-invitation/abc",
    });

    expect(mail.links()).toEqual(["https://app.open-dpp.test/accept-invitation/abc"]);
  });
});
