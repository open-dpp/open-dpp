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
import { Logger } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { InstanceSettingsService } from "../instance-settings/application/services/instance-settings.service";
import { BaseEmail } from "./domain/base-email";
import { EmailChangeNotificationMail } from "./domain/email-change-notification-mail";
import { EmailTemplate } from "./domain/email-template";
import { EmailService } from "./email.service";

interface CapturedMail {
  html: string;
}

// In production the service runs as CommonJS, where `__dirname` resolves to the
// compiled email directory that the .mjml templates are copied next to. The Jest
// ESM runtime defines no `__dirname`, so we point it at the source email
// directory where the templates actually live (Jest runs with apps/main as cwd).
const moduleDir = resolve(process.cwd(), "src/email");

type SendMail = jest.Mock<(options: { html: string }) => Promise<void>>;

const envWith = (values: Record<string, unknown>) =>
  ({ get: jest.fn((key: string) => values[key]) }) as unknown as EnvService;

const settingsWith = (mailEnabled: boolean) =>
  ({
    getSettings: jest.fn(async () => ({ mailEnabled: { value: mailEnabled } })),
  }) as unknown as InstanceSettingsService;

const SMTP_ENV = {
  OPEN_DPP_MAIL_HOST: "smtp.example.com",
  OPEN_DPP_MAIL_PORT: 587,
  OPEN_DPP_MAIL_SENDER_ADDRESS: "noreply@open-dpp.test",
};

/** Wires a fake SMTP transporter in place of the one setupTransporter() creates. */
function withSmtpStub(service: EmailService): SendMail {
  const sendMail = jest
    .fn<(options: { html: string }) => Promise<void>>()
    .mockResolvedValue(undefined);
  (service as unknown as { smtpTransporter: { sendMail: SendMail } }).smtpTransporter = {
    sendMail,
  };
  return sendMail;
}

describe("EmailService when mail is disabled", () => {
  let warn: jest.SpiedFunction<Logger["warn"]>;

  beforeAll(() => {
    (globalThis as Record<string, unknown>).__dirname = moduleDir;
  });

  afterAll(() => {
    delete (globalThis as Record<string, unknown>).__dirname;
  });

  beforeEach(() => {
    warn = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const verifyMail = () =>
    new BaseEmail(
      "test-id",
      "VERIFY_EMAIL",
      new EmailTemplate("email-verify.mjml", {
        firstName: "Ada",
        link: "https://app.open-dpp.test/verify-email?token=abc",
      } as never),
      "ada@example.com",
      "Verify E-Mail address",
    );

  it("boots without an SMTP host and warns that links go to the log", async () => {
    const service = new EmailService(envWith({}), settingsWith(true));

    await service.setupTransporter();

    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/OPEN_DPP_MAIL_HOST.*log/));
  });

  it("logs type, recipient, subject and link instead of sending when no host is set", async () => {
    const service = new EmailService(envWith({}), settingsWith(true));
    await service.setupTransporter();

    await expect(service.send(verifyMail())).resolves.toBeUndefined();

    const line = warn.mock.calls
      .map(([message]) => String(message))
      .find((m) => m.includes("VERIFY_EMAIL"));
    expect(line).toContain("ada@example.com");
    expect(line).toContain("Verify E-Mail address");
    expect(line).toContain("https://app.open-dpp.test/verify-email?token=abc");
  });

  it("logs instead of sending when SMTP is configured but the admin switched mail off", async () => {
    const service = new EmailService(envWith(SMTP_ENV), settingsWith(false));
    const smtp = withSmtpStub(service);

    await service.send(verifyMail());

    expect(smtp).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("VERIFY_EMAIL"));
  });

  it("sends via SMTP when configured and enabled", async () => {
    const service = new EmailService(envWith(SMTP_ENV), settingsWith(true));
    const smtp = withSmtpStub(service);

    await service.send(verifyMail());

    expect(smtp).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "noreply@open-dpp.test",
        to: "ada@example.com",
        subject: "Verify E-Mail address",
      }),
    );
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("EmailService template localization", () => {
  let service: EmailService;
  let sendMail: SendMail;

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
    service = new EmailService(envWith(SMTP_ENV), settingsWith(true));
    sendMail = withSmtpStub(service);
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
});
