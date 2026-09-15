import { describe, expect, it } from "@jest/globals";
import { WelcomeMail } from "./welcome-mail";

describe("WelcomeMail", () => {
  const createProps = {
    to: "jane@example.com",
    subject: "Start using open-dpp",
    templateProperties: {
      firstName: "Jane",
      organizationName: "ACME GmbH",
      link: "https://app.open-dpp.test/password-reset?token=abc",
    },
  };

  it("creates a mail with a generated id, type and template", () => {
    const mail = WelcomeMail.create(createProps);

    expect(mail.id).toEqual(expect.any(String));
    expect(mail.type).toBe("WELCOME");
    expect(mail.template.name).toBe("provisioning-welcome.mjml");
    expect(mail.to).toBe(createProps.to);
    expect(mail.subject).toBe(createProps.subject);
    expect(mail.templateProperties).toEqual(createProps.templateProperties);
  });

  it("defaults the language to en and carries a provided language", () => {
    expect(WelcomeMail.create(createProps).language).toBe("en");
    expect(WelcomeMail.create({ ...createProps, language: "de" }).language).toBe("de");
  });
});
