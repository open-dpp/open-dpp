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
import { OrganizationReadyMail } from "./domain/organization-ready-mail";
import { VerifyEmailMail } from "./domain/verify-email-mail";
import { WelcomeMail } from "./domain/welcome-mail";
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
    // invite-user-to-organization.mjml ships without a -de variant.
    const mailWithoutGermanVariant = new BaseEmail(
      "test-id",
      "INVITE_USER_TO_ORGANIZATION",
      new EmailTemplate("invite-user-to-organization.mjml", {
        firstName: "Ada",
        organizationName: "ACME GmbH",
        link: "https://app.open-dpp.test/accept-invitation/1",
      } as never),
      "to@example.com",
      "Invitation to join organization",
      "de",
    );

    await service.send(mailWithoutGermanVariant);

    const html = lastHtml();
    expect(html).toContain("Hey Ada!");
    expect(html).not.toContain("Guten Tag");
  });
});

describe("EmailService provisioning templates", () => {
  let service: EmailService;
  let sendMail: jest.Mock<(options: { html: string }) => Promise<void>>;

  const lastHtml = (): string => {
    const calls = sendMail.mock.calls as Array<[CapturedMail]>;
    return calls[calls.length - 1][0].html;
  };

  const welcome = (language: "en" | "de", firstName = "Ada", organizationName = "ACME GmbH") =>
    WelcomeMail.create({
      to: "to@example.com",
      subject: "Start using open-dpp",
      language,
      templateProperties: {
        firstName,
        organizationName,
        link: "https://app.open-dpp.test/password-reset?token=abc",
      },
    });

  const ready = (language: "en" | "de", firstName = "Ada") =>
    OrganizationReadyMail.create({
      to: "to@example.com",
      subject: "Your organization ACME GmbH is ready",
      language,
      templateProperties: {
        firstName,
        organizationName: "ACME GmbH",
        link: "https://app.open-dpp.test/organizations/org-1/passports",
      },
    });

  const verify = (language: "en" | "de", firstName = "Ada") =>
    VerifyEmailMail.create({
      to: "to@example.com",
      subject: "Verify E-Mail address",
      language,
      templateProperties: { firstName, link: "https://app.open-dpp.test/verify?token=abc" },
    });

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

  it("renders the English welcome mail", async () => {
    await service.send(welcome("en"));

    const html = lastHtml();
    expect(html).toContain("Hello Ada,");
    expect(html).toContain("Your organization ACME GmbH has been set up for you on open-dpp");
    expect(html).toContain("Start using open-dpp");
    expect(html).toContain("valid for one hour");
    // Handlebars HTML-escapes attribute values ("=" becomes "&#x3D;"); mail clients decode it.
    expect(html.replace(/&#x3D;/g, "=")).toContain(
      "https://app.open-dpp.test/password-reset?token=abc",
    );
    expect(html).not.toContain("Guten Tag");
  });

  it("renders the German welcome mail in the formal register", async () => {
    await service.send(welcome("de"));

    const html = lastHtml();
    expect(html).toContain("Guten Tag Ada,");
    expect(html).toContain("Ihre Organisation ACME GmbH wurde");
    expect(html).toContain("Jetzt mit open-dpp starten");
    expect(html).toContain("eine Stunde");
    expect(html).not.toContain("Hello Ada");
    expect(html).not.toMatch(/\b[Dd]u\b/);
  });

  it("greets without a name when the first name is empty", async () => {
    await service.send(welcome("en", ""));
    expect(lastHtml()).toContain("Hello,");
    expect(lastHtml()).not.toContain("Hello ,");

    await service.send(welcome("de", ""));
    expect(lastHtml()).toContain("Guten Tag,");
    expect(lastHtml()).not.toContain("Guten Tag ,");
  });

  it("escapes the organization name", async () => {
    await service.send(welcome("en", "Ada", "<b>ACME</b> & Co"));

    const html = lastHtml();
    expect(html).toContain("&lt;b&gt;ACME&lt;/b&gt; &amp; Co");
    expect(html).not.toContain("<b>ACME</b>");
  });

  it("renders the ready mail in both languages", async () => {
    await service.send(ready("en"));
    let html = lastHtml();
    expect(html).toContain("Hello Ada,");
    expect(html).toContain("Your organization ACME GmbH has been set up on open-dpp");
    expect(html).toContain("Your existing account was used");
    expect(html).toContain("To open-dpp");
    expect(html).toContain("https://app.open-dpp.test/organizations/org-1/passports");

    await service.send(ready("de"));
    html = lastHtml();
    expect(html).toContain("Guten Tag Ada,");
    expect(html).toContain("Ihre Organisation ACME GmbH wurde auf open-dpp eingerichtet");
    expect(html).toContain("bestehendes Konto");
    expect(html).toContain("Zu open-dpp");
    expect(html).not.toContain("Hello Ada");
  });

  it("renders the German verification mail and keeps the English one", async () => {
    await service.send(verify("de"));
    let html = lastHtml();
    expect(html).toContain("Guten Tag Ada,");
    expect(html).toContain("Registrierung bei open-dpp");
    expect(html).not.toContain("Hey Ada!");

    await service.send(verify("en"));
    html = lastHtml();
    expect(html).toContain("Hey Ada!");
    expect(html).toContain("Please verify your email address");

    await service.send(verify("en", ""));
    html = lastHtml();
    expect(html).toContain("Hey there!");
    expect(html).not.toContain("Hey !");

    await service.send(verify("de", ""));
    expect(lastHtml()).toContain("Guten Tag,");
  });
});
