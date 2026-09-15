import { describe, expect, it } from "@jest/globals";
import { OrganizationReadyMail } from "./organization-ready-mail";

describe("OrganizationReadyMail", () => {
  const createProps = {
    to: "jane@example.com",
    subject: "Your organization ACME GmbH is ready",
    templateProperties: {
      firstName: "Jane",
      organizationName: "ACME GmbH",
      link: "https://app.open-dpp.test/organizations/org-1/passports",
    },
  };

  it("creates a mail with a generated id, type and template", () => {
    const mail = OrganizationReadyMail.create(createProps);

    expect(mail.id).toEqual(expect.any(String));
    expect(mail.type).toBe("ORGANIZATION_READY");
    expect(mail.template.name).toBe("organization-ready.mjml");
    expect(mail.to).toBe(createProps.to);
    expect(mail.subject).toBe(createProps.subject);
    expect(mail.templateProperties).toEqual(createProps.templateProperties);
  });

  it("defaults the language to en and carries a provided language", () => {
    expect(OrganizationReadyMail.create(createProps).language).toBe("en");
    expect(OrganizationReadyMail.create({ ...createProps, language: "de" }).language).toBe("de");
  });
});
