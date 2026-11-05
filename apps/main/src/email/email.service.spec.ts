import { resolve } from "node:path";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { EnvService } from "@open-dpp/env";
import { BaseEmail } from "./domain/base-email";
import { EmailChangeNotificationMail } from "./domain/email-change-notification-mail";
import { EmailTemplate } from "./domain/email-template";
import { GuestAccessRevokedMail } from "./domain/guest-access-revoked-mail";
import { GuestRoleChangedMail } from "./domain/guest-role-changed-mail";
import { InviteGuestMail } from "./domain/invite-guest-mail";
import { EmailService } from "./email.service";

interface CapturedMail {
  html: string;
}

// In production the service runs as CommonJS, where `__dirname` resolves to the
// compiled email directory that the .mjml templates are copied next to. The Jest
// ESM runtime defines no `__dirname`, so we point it at the source email
// directory where the templates actually live (Jest runs with apps/main as cwd).
const moduleDir = resolve(process.cwd(), "src/email");

describe("EmailService template localization", () => {
  let service: EmailService;
  let sendMail: jest.Mock<(options: { html: string }) => Promise<void>>;

  const notificationMail = (language?: "en" | "de") =>
    EmailChangeNotificationMail.create({
      to: "to@example.com",
      subject: "Your email is being changed",
      language,
      templateProperties: {
        firstName: "Ada",
        currentEmail: "current@example.com",
        newEmail: "new@example.com",
        revokeUrl: "https://app.open-dpp.test/account/email-change-revoke?token=abc",
      },
    });

  const lastHtml = (): string => {
    const calls = sendMail.mock.calls as Array<[CapturedMail]>;
    return calls[calls.length - 1][0].html;
  };

  beforeAll(() => {
    (globalThis as Record<string, unknown>).__dirname = moduleDir;
  });

  afterAll(() => {
    delete (globalThis as Record<string, unknown>).__dirname;
  });

  beforeEach(() => {
    const env = {
      get: jest.fn((key: string) =>
        key === "OPEN_DPP_MAIL_SENDER_ADDRESS" ? "noreply@open-dpp.test" : undefined,
      ),
    } as unknown as EnvService;
    service = new EmailService(env);
    sendMail = jest.fn<(options: { html: string }) => Promise<void>>().mockResolvedValue(undefined);
    (service as unknown as { transporter: { sendMail: typeof sendMail } }).transporter = {
      sendMail,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the German template when language is 'de' and the -de variant exists", async () => {
    await service.send(notificationMail("de"));

    const html = lastHtml();
    expect(html).toContain("Hallo Ada");
    expect(html).toContain("wir haben eine Anfrage erhalten");
    expect(html).not.toContain("Hi Ada");
  });

  it("renders the English template unchanged when language defaults to 'en'", async () => {
    await service.send(notificationMail());

    const html = lastHtml();
    expect(html).toContain("Hi Ada");
    expect(html).toContain("We received a request");
    expect(html).not.toContain("Hallo Ada");
  });

  it("renders the English template when language is explicitly 'en'", async () => {
    await service.send(notificationMail("en"));

    const html = lastHtml();
    expect(html).toContain("Hi Ada");
    expect(html).not.toContain("Hallo Ada");
  });

  it("falls back to the English template when the requested -de variant is missing", async () => {
    // email-verify.mjml ships without an email-verify-de.mjml variant.
    const mailWithoutGermanVariant = new BaseEmail(
      "test-id",
      "VERIFY_EMAIL",
      new EmailTemplate("email-verify.mjml", {
        firstName: "Ada",
        link: "https://app.open-dpp.test/verify",
      } as never),
      "to@example.com",
      "Verify E-Mail address",
      "de",
    );

    await service.send(mailWithoutGermanVariant);

    const html = lastHtml();
    expect(html).toContain("Please verify your email address");
    expect(html).toContain("Hey Ada!");
  });

  describe("guest mails", () => {
    // like the real link: the address and the encoded return URL as query parameters
    const link =
      "https://app.open-dpp.test/signup?email=repairer%40example.com&redirect=https%253A%252F%252Fapp.open-dpp.test%252Faccept-guest-access%252Faccess-1";

    const hrefs = (html: string) =>
      [...html.matchAll(/href="([^"]+)"/g)].map((match) =>
        // "&amp;" last: decoding it first would turn "&amp;#x3D;" into "=" as well
        match[1].replaceAll("&#x3D;", "=").replaceAll("&amp;", "&"),
      );

    const invitation = (hasAccount: boolean, language?: "en" | "de") =>
      InviteGuestMail.create({
        to: "to@example.com",
        language,
        templateProperties: {
          link,
          hasAccount,
          organizationName: "ACME GmbH",
          guestRoleName: "Repairer",
        },
      });

    it("renders the invitation for someone who has an account", async () => {
      await service.send(invitation(true));
      expect(lastHtml()).toContain("You have been invited as a guest");
      expect(lastHtml()).toContain("Sign in with this email address");
      expect(lastHtml()).toMatch(/>\s*Accept invitation\s*</);
      expect(lastHtml()).not.toContain("Create an account");

      await service.send(invitation(true, "de"));
      expect(lastHtml()).toContain("Du wurdest als Gast eingeladen");
      expect(lastHtml()).toContain("Melde dich mit dieser E-Mail-Adresse an");
      expect(lastHtml()).toMatch(/>\s*Einladung annehmen\s*</);
      expect(lastHtml()).not.toContain("Erstelle ein Konto");
    });

    it("renders the invitation for someone who needs an account first", async () => {
      await service.send(invitation(false));
      expect(lastHtml()).toContain("Create an account with this email address");
      expect(lastHtml()).toContain("second email to verify your address");
      expect(lastHtml()).toMatch(/>\s*Create account\s*</);
      expect(lastHtml()).not.toMatch(/>\s*Accept invitation\s*</);

      await service.send(invitation(false, "de"));
      expect(lastHtml()).toContain("Erstelle ein Konto mit dieser E-Mail-Adresse");
      expect(lastHtml()).toContain("zweite E-Mail");
      expect(lastHtml()).toMatch(/>\s*Konto erstellen\s*</);
      expect(lastHtml()).not.toMatch(/>\s*Einladung annehmen\s*</);
    });

    it("keeps the link of the invitation intact", async () => {
      await service.send(invitation(false));

      expect(hrefs(lastHtml())).toContain(link);
    });

    it("renders the role change with the link only for an invitation not accepted yet", async () => {
      const properties = { organizationName: "ACME GmbH", guestRoleName: "Supplier" };

      await service.send(
        GuestRoleChangedMail.create({ to: "to@example.com", templateProperties: properties }),
      );
      expect(lastHtml()).toContain("Your guest role has changed");
      expect(lastHtml()).toContain("Supplier");
      expect(lastHtml()).not.toContain("Accept invitation");
      expect(lastHtml()).not.toContain("Create account");

      await service.send(
        GuestRoleChangedMail.create({
          to: "to@example.com",
          templateProperties: { ...properties, link, hasAccount: true },
        }),
      );
      expect(lastHtml()).toContain("Accept invitation");
      expect(hrefs(lastHtml())).toContain(link);

      await service.send(
        GuestRoleChangedMail.create({
          to: "to@example.com",
          templateProperties: { ...properties, link, hasAccount: false },
        }),
      );
      expect(lastHtml()).toContain("Create account");
      expect(lastHtml()).toContain("second email to verify your address");

      await service.send(
        GuestRoleChangedMail.create({
          to: "to@example.com",
          language: "de",
          templateProperties: { ...properties, link, hasAccount: true },
        }),
      );
      expect(lastHtml()).toContain("Deine Gastrolle wurde ge&auml;ndert");
      expect(lastHtml()).toContain("Einladung annehmen");

      await service.send(
        GuestRoleChangedMail.create({
          to: "to@example.com",
          language: "de",
          templateProperties: { ...properties, link, hasAccount: false },
        }),
      );
      expect(lastHtml()).toContain("Konto erstellen");
    });

    it("renders a revoked access or a withdrawn invitation", async () => {
      const mail = (accepted: boolean, language?: "en" | "de") =>
        GuestAccessRevokedMail.create({
          to: "to@example.com",
          language,
          templateProperties: { organizationName: "ACME GmbH", accepted },
        });

      await service.send(mail(true));
      expect(lastHtml()).toContain("Your guest access was revoked");
      expect(lastHtml()).not.toContain("Your invitation was withdrawn");

      await service.send(mail(false));
      expect(lastHtml()).toContain("Your invitation was withdrawn");
      expect(lastHtml()).not.toContain("Your guest access was revoked");

      await service.send(mail(true, "de"));
      expect(lastHtml()).toContain("Dein Gastzugriff wurde entzogen");

      await service.send(mail(false, "de"));
      expect(lastHtml()).toContain("Deine Einladung wurde zur&uuml;ckgezogen");
    });

    it("uses the subject of the language", () => {
      expect(
        GuestAccessRevokedMail.create({
          to: "to@example.com",
          language: "de",
          templateProperties: { organizationName: "ACME GmbH", accepted: false },
        }).subject,
      ).toEqual("Deine Einladung wurde zurückgezogen");
      expect(
        GuestRoleChangedMail.create({
          to: "to@example.com",
          templateProperties: { organizationName: "ACME GmbH", guestRoleName: "Supplier" },
        }).subject,
      ).toEqual("Your guest role has changed");
    });
  });
});
