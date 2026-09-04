import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Logger } from "@nestjs/common";
import type { Db } from "mongodb";
import type { EmailService } from "../../../email/email.service";
import {
  completeVerifiedEmailChange,
  decodeVerificationToken,
  guardEmailChangeUpdate,
  resolveUserLanguage,
} from "./email-change-hooks";

/** Builds a better-auth-style verification token whose middle segment is the base64url JSON payload. */
function contextWithToken(payload: Record<string, unknown>): unknown {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { query: { token: `header.${encoded}.signature` } };
}

describe("email-change-hooks", () => {
  let userFindOne: jest.Mock;
  let ecrFindOne: jest.Mock;
  let ecrDeleteOne: jest.Mock;
  let collection: jest.Mock;
  let db: Db;
  let logger: Logger;
  let send: jest.Mock;
  let emailService: EmailService;

  beforeEach(() => {
    userFindOne = jest.fn();
    ecrFindOne = jest.fn();
    ecrDeleteOne = jest.fn();
    collection = jest.fn((name: string) =>
      name === "user" ? { findOne: userFindOne } : { findOne: ecrFindOne, deleteOne: ecrDeleteOne },
    ) as jest.Mock;
    db = { collection } as unknown as Db;
    logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
    send = jest.fn();
    emailService = { send } as unknown as EmailService;
  });

  describe("decodeVerificationToken", () => {
    it("extracts email and updateTo from the token payload", () => {
      expect(
        decodeVerificationToken(contextWithToken({ email: "a@x.com", updateTo: "b@x.com" })),
      ).toEqual({ email: "a@x.com", updateTo: "b@x.com" });
    });

    it("returns undefined for a missing or malformed token", () => {
      expect(decodeVerificationToken(undefined)).toBeUndefined();
      expect(decodeVerificationToken({ query: { token: "nosegments" } })).toBeUndefined();
    });
  });

  describe("resolveUserLanguage", () => {
    it("returns 'de' only when preferredLanguage is exactly 'de', else 'en'", () => {
      expect(resolveUserLanguage({ preferredLanguage: "de" })).toBe("de");
      expect(resolveUserLanguage({ preferredLanguage: "fr" })).toBe("en");
      expect(resolveUserLanguage(null)).toBe("en");
    });
  });

  describe("guardEmailChangeUpdate", () => {
    it("allows non-email updates without touching the database", async () => {
      const result = await guardEmailChangeUpdate(db, logger, { firstName: "Ada" }, undefined);

      expect(result).toBeUndefined();
      expect(collection).not.toHaveBeenCalled();
    });

    it("blocks when the verification token carries no originating email", async () => {
      const result = await guardEmailChangeUpdate(
        db,
        logger,
        { email: "new@x.com" },
        contextWithToken({ updateTo: "new@x.com" }),
      );

      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalled();
      expect(userFindOne).not.toHaveBeenCalled();
    });

    it("blocks when no user matches the token subject", async () => {
      userFindOne.mockResolvedValue(null as never);

      const result = await guardEmailChangeUpdate(
        db,
        logger,
        { email: "new@x.com" },
        contextWithToken({ email: "OLD@x.com" }),
      );

      expect(result).toBe(false);
      // subject email is looked up lower-cased
      expect(userFindOne).toHaveBeenCalledWith({ email: { $eq: "old@x.com" } });
    });

    it("blocks when no pending request matches the new email", async () => {
      userFindOne.mockResolvedValue({ _id: "user-1" } as never);
      ecrFindOne.mockResolvedValue({
        _id: "r1",
        userId: "user-1",
        newEmail: "different@x.com",
        previousEmail: "old@x.com",
        requestedAt: new Date(0),
      } as never);

      const result = await guardEmailChangeUpdate(
        db,
        logger,
        { email: "new@x.com" },
        contextWithToken({ email: "old@x.com" }),
      );

      expect(result).toBe(false);
    });

    it("allows the update when a pending request matches the token subject and new email", async () => {
      userFindOne.mockResolvedValue({ _id: "user-1" } as never);
      ecrFindOne.mockResolvedValue({
        _id: "r1",
        userId: "user-1",
        newEmail: "new@x.com",
        previousEmail: "old@x.com",
        requestedAt: new Date(0),
      } as never);

      const result = await guardEmailChangeUpdate(
        db,
        logger,
        { email: "new@x.com" },
        contextWithToken({ email: "old@x.com" }),
      );

      expect(result).toBeUndefined();
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe("completeVerifiedEmailChange", () => {
    const user = { id: "user-1", email: "new@x.com", firstName: "Ada" };

    function pending(newEmail: string) {
      return {
        _id: "r1",
        userId: "user-1",
        newEmail,
        previousEmail: "old@x.com",
        requestedAt: new Date(0),
      };
    }

    it("notifies the new address and clears the pending request on a matching change", async () => {
      ecrFindOne.mockResolvedValue(pending("new@x.com") as never);

      await completeVerifiedEmailChange(db, emailService, logger, user);

      expect(send).toHaveBeenCalledTimes(1);
      const mail = send.mock.calls[0][0] as {
        to: string;
        subject: string;
        language: string;
        templateProperties: { previousEmail: string; currentEmail: string };
      };
      expect(mail.to).toBe("new@x.com");
      expect(mail.subject).toBe("Your email address was changed");
      expect(mail.language).toBe("en");
      expect(mail.templateProperties.previousEmail).toBe("old@x.com");
      expect(mail.templateProperties.currentEmail).toBe("new@x.com");
      expect(ecrDeleteOne).toHaveBeenCalledWith({ userId: { $eq: "user-1" } });
    });

    it("localizes the completion mail subject and body for a German user", async () => {
      ecrFindOne.mockResolvedValue(pending("new@x.com") as never);

      await completeVerifiedEmailChange(db, emailService, logger, {
        ...user,
        preferredLanguage: "de",
      });

      const mail = send.mock.calls[0][0] as { subject: string; language: string };
      expect(mail.subject).toBe("E-Mail-Adresse erfolgreich geändert");
      expect(mail.language).toBe("de");
    });

    it("no-ops when there is no pending request", async () => {
      ecrFindOne.mockResolvedValue(null as never);

      await completeVerifiedEmailChange(db, emailService, logger, user);

      expect(send).not.toHaveBeenCalled();
      expect(ecrDeleteOne).not.toHaveBeenCalled();
    });

    it("no-ops when the pending request targets a different email", async () => {
      ecrFindOne.mockResolvedValue(pending("someone-else@x.com") as never);

      await completeVerifiedEmailChange(db, emailService, logger, user);

      expect(send).not.toHaveBeenCalled();
      expect(ecrDeleteOne).not.toHaveBeenCalled();
    });

    it("still clears the pending request when the notification email fails", async () => {
      ecrFindOne.mockResolvedValue(pending("new@x.com") as never);
      send.mockRejectedValue(new Error("SMTP unavailable") as never);

      await completeVerifiedEmailChange(db, emailService, logger, user);

      expect(logger.error).toHaveBeenCalled();
      expect(ecrDeleteOne).toHaveBeenCalledWith({ userId: { $eq: "user-1" } });
    });

    it("swallows and logs unexpected failures instead of throwing", async () => {
      ecrFindOne.mockRejectedValue(new Error("db down") as never);

      await expect(
        completeVerifiedEmailChange(db, emailService, logger, user),
      ).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
