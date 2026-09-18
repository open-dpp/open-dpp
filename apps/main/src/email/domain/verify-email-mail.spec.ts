import { describe, expect, it } from "@jest/globals";
import { VerifyEmailMail } from "./verify-email-mail";

describe("VerifyEmailMail", () => {
  const createProps = {
    to: "jane@example.com",
    subject: "Verify E-Mail address",
    templateProperties: { firstName: "Jane", link: "https://app.open-dpp.test/verify?token=abc" },
  };

  it("keeps type and template", () => {
    const mail = VerifyEmailMail.create(createProps);
    expect(mail.type).toBe("VERIFY_EMAIL");
    expect(mail.template.name).toBe("email-verify.mjml");
  });

  it("defaults the language to en and carries a provided language", () => {
    expect(VerifyEmailMail.create(createProps).language).toBe("en");
    expect(VerifyEmailMail.create({ ...createProps, language: "de" }).language).toBe("de");
  });
});
