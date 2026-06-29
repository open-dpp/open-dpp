import { expect } from "@jest/globals";
import { EmailChangeVerificationMail } from "./email-change-verification-mail";

describe("EmailChangeVerificationMail", () => {
  const createProps = {
    to: "new@example.com",
    subject: "Confirm your new email address",
    templateProperties: {
      firstName: "Ada",
      newEmail: "new@example.com",
      link: "https://app.open-dpp.de/verify-email-change?token=abc",
    },
  };

  it("should create a mail with a generated id", () => {
    const mail = EmailChangeVerificationMail.create(createProps);

    expect(mail.id).toEqual(expect.any(String));
    expect(mail.id.length).toBeGreaterThan(0);
  });

  it("should set the EMAIL_CHANGE_VERIFICATION type", () => {
    const mail = EmailChangeVerificationMail.create(createProps);

    expect(mail.type).toBe("EMAIL_CHANGE_VERIFICATION");
  });

  it("should reference the email-change-verification.mjml template", () => {
    const mail = EmailChangeVerificationMail.create(createProps);

    expect(mail.template).toBe("email-change-verification.mjml");
  });

  it("should set the recipient and subject", () => {
    const mail = EmailChangeVerificationMail.create(createProps);

    expect(mail.to).toBe(createProps.to);
    expect(mail.subject).toBe(createProps.subject);
  });

  it("should set the template properties", () => {
    const mail = EmailChangeVerificationMail.create(createProps);

    expect(mail.templateProperties).toEqual(createProps.templateProperties);
  });

  it("should default the language to 'en' when none is provided", () => {
    const mail = EmailChangeVerificationMail.create(createProps);

    expect(mail.language).toBe("en");
  });

  it("should carry the provided language", () => {
    const mail = EmailChangeVerificationMail.create({ ...createProps, language: "de" });

    expect(mail.language).toBe("de");
  });
});
