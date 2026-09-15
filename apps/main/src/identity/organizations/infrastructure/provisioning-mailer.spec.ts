import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import { BaseEmail, BaseEmailTypes } from "../../../email/domain/base-email";
import { User } from "../../users/domain/user";
import { UserRole } from "../../users/domain/user-role.enum";
import { Organization } from "../domain/organization";
import { ProvisioningMailer } from "./provisioning-mailer";

const BASE_URL = "https://app.open-dpp.test";
const TOKEN = "t0k3n-that-must-never-be-logged";
const VERIFY_LINK = `${BASE_URL}/api/v2/auth/verify-email?token=jwt&callbackURL=%2Femail-verified`;

function makeUser(
  overrides: Partial<{
    emailVerified: boolean;
    firstName: string | null;
    preferredLanguage: "en" | "de";
  }> = {},
): User {
  return User.loadFromDb({
    id: "user-1",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: UserRole.USER,
    preferredLanguage: "en",
    ...overrides,
  });
}

const organization = Organization.loadFromDb({
  id: "org-1",
  name: "ACME GmbH",
  slug: "org-1",
  logo: null,
  metadata: {},
  createdAt: new Date(),
});

describe("ProvisioningMailer", () => {
  let send: jest.Mock<(mail: BaseEmail) => Promise<void>>;
  let buildVerificationLink: jest.Mock<(email: string) => Promise<string>>;
  let mint: jest.Mock<(userId: string) => Promise<string>>;
  let logError: jest.SpiedFunction<typeof Logger.prototype.error>;
  let mailer: ProvisioningMailer;

  const sentMails = () => send.mock.calls.map(([mail]) => mail);
  const mailOfType = (type: string) => sentMails().find((mail) => mail.type === type);
  const loggedText = () => logError.mock.calls.flat().map(String).join(" ");

  beforeEach(() => {
    send = jest.fn<(mail: BaseEmail) => Promise<void>>().mockResolvedValue(undefined);
    buildVerificationLink = jest
      .fn<(email: string) => Promise<string>>()
      .mockResolvedValue(VERIFY_LINK);
    mint = jest.fn<(userId: string) => Promise<string>>().mockResolvedValue(TOKEN);
    logError = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const env = { get: jest.fn((key: string) => (key === "OPEN_DPP_URL" ? BASE_URL : undefined)) };
    mailer = new ProvisioningMailer(
      { send } as never,
      env as never,
      { mint } as never,
      { build: buildVerificationLink } as never,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("unverified owner", () => {
    it("sends the welcome mail with a freshly minted reset link plus the verification mail", async () => {
      const sent = await mailer.notifyOwner({ user: makeUser(), organization, language: "en" });

      expect(sent).toBe(true);
      expect(mint).toHaveBeenCalledWith("user-1");
      const welcome = mailOfType(BaseEmailTypes.Welcome);
      expect(welcome).toBeDefined();
      expect(welcome!.to).toBe("jane@example.com");
      expect(welcome!.subject).toBe("Start using open-dpp");
      expect(welcome!.language).toBe("en");
      expect(welcome!.templateProperties).toEqual({
        firstName: "Jane",
        organizationName: "ACME GmbH",
        link: `${BASE_URL}/password-reset?token=${TOKEN}`,
      });
      expect(buildVerificationLink).toHaveBeenCalledWith("jane@example.com");
      const verify = mailOfType(BaseEmailTypes.VerifyEmail);
      expect(verify).toBeDefined();
      expect(verify!.to).toBe("jane@example.com");
      expect(verify!.subject).toBe("Verify E-Mail address");
      expect(verify!.language).toBe("en");
      expect(verify!.templateProperties).toEqual({ firstName: "Jane", link: VERIFY_LINK });
      expect(mailOfType(BaseEmailTypes.OrganizationReady)).toBeUndefined();
    });

    it("localizes the welcome and verification mails", async () => {
      await mailer.notifyOwner({ user: makeUser(), organization, language: "de" });

      const welcome = mailOfType(BaseEmailTypes.Welcome);
      expect(welcome!.subject).toBe("Jetzt mit open-dpp starten");
      expect(welcome!.language).toBe("de");
      const verify = mailOfType(BaseEmailTypes.VerifyEmail);
      expect(verify!.subject).toBe("E-Mail-Adresse bestätigen");
      expect(verify!.language).toBe("de");
    });

    it("passes an empty first name when the user has none", async () => {
      await mailer.notifyOwner({
        user: makeUser({ firstName: null }),
        organization,
        language: "en",
      });

      expect(mailOfType(BaseEmailTypes.Welcome)!.templateProperties).toEqual(
        expect.objectContaining({ firstName: "" }),
      );
      expect(mailOfType(BaseEmailTypes.VerifyEmail)!.templateProperties).toEqual(
        expect.objectContaining({ firstName: "" }),
      );
    });

    it("returns false and logs when the welcome mail fails, still sending the verification mail", async () => {
      send.mockRejectedValueOnce(new Error("SMTP down"));

      const sent = await mailer.notifyOwner({ user: makeUser(), organization, language: "en" });

      expect(sent).toBe(false);
      expect(mailOfType(BaseEmailTypes.VerifyEmail)).toBeDefined();
      expect(loggedText()).toContain("user-1");
      expect(loggedText()).not.toContain(TOKEN);
    });

    it("returns false when the reset token cannot be minted, still sending the verification mail", async () => {
      mint.mockRejectedValueOnce(new Error("db down"));

      const sent = await mailer.notifyOwner({ user: makeUser(), organization, language: "en" });

      expect(sent).toBe(false);
      expect(mailOfType(BaseEmailTypes.Welcome)).toBeUndefined();
      expect(mailOfType(BaseEmailTypes.VerifyEmail)).toBeDefined();
      expect(logError).toHaveBeenCalled();
    });

    it("returns false when the verification mail fails after the welcome mail was sent", async () => {
      send.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("SMTP down"));

      const sent = await mailer.notifyOwner({ user: makeUser(), organization, language: "en" });

      expect(sent).toBe(false);
      expect(mailOfType(BaseEmailTypes.Welcome)).toBeDefined();
      expect(loggedText()).toContain("user-1");
    });

    it("returns false when the verification link cannot be built", async () => {
      buildVerificationLink.mockRejectedValueOnce(new Error("no secret"));

      const sent = await mailer.notifyOwner({ user: makeUser(), organization, language: "en" });

      expect(sent).toBe(false);
      expect(mailOfType(BaseEmailTypes.Welcome)).toBeDefined();
      expect(mailOfType(BaseEmailTypes.VerifyEmail)).toBeUndefined();
    });
  });

  describe("verified owner", () => {
    it("sends only the ready mail linking to the passports of the new organization", async () => {
      const sent = await mailer.notifyOwner({
        user: makeUser({ emailVerified: true }),
        organization,
        language: "en",
      });

      expect(sent).toBe(true);
      const ready = mailOfType(BaseEmailTypes.OrganizationReady);
      expect(ready).toBeDefined();
      expect(ready!.to).toBe("jane@example.com");
      expect(ready!.subject).toBe("Your organization ACME GmbH is ready");
      expect(ready!.language).toBe("en");
      expect(ready!.templateProperties).toEqual({
        firstName: "Jane",
        organizationName: "ACME GmbH",
        link: `${BASE_URL}/organizations/org-1/passports`,
      });
      expect(mint).not.toHaveBeenCalled();
      expect(buildVerificationLink).not.toHaveBeenCalled();
      expect(sentMails()).toHaveLength(1);
    });

    it("localizes the ready mail", async () => {
      await mailer.notifyOwner({
        user: makeUser({ emailVerified: true }),
        organization,
        language: "de",
      });

      const ready = mailOfType(BaseEmailTypes.OrganizationReady);
      expect(ready!.subject).toBe("Ihre Organisation ACME GmbH ist bereit");
      expect(ready!.language).toBe("de");
    });

    it("returns false and logs when the ready mail fails", async () => {
      send.mockRejectedValueOnce(new Error("SMTP down"));

      const sent = await mailer.notifyOwner({
        user: makeUser({ emailVerified: true }),
        organization,
        language: "en",
      });

      expect(sent).toBe(false);
      expect(loggedText()).toContain("user-1");
    });
  });
});
