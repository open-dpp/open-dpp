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
      "email-verify.mjml",
      "to@example.com",
      "Verify E-Mail address",
      { firstName: "Ada", link: "https://app.open-dpp.test/verify" } as never,
      "de",
    );

    await service.send(mailWithoutGermanVariant);

    const html = lastHtml();
    expect(html).toContain("Please verify your email address");
    expect(html).toContain("Hey Ada!");
  });
});
