import { describe, expect, it } from "@jest/globals";
import { ValueError } from "@open-dpp/exception";
import { EmailChangeRequest } from "./email-change-request";

describe("EmailChangeRequest", () => {
  it("creates with a generated id and current timestamp", () => {
    const before = new Date();
    const request = EmailChangeRequest.create({
      userId: "user-1",
      newEmail: "new@example.com",
      previousEmail: "old@example.com",
    });
    const after = new Date();

    expect(request.id).toEqual(expect.any(String));
    expect(request.userId).toBe("user-1");
    expect(request.newEmail).toBe("new@example.com");
    expect(request.previousEmail).toBe("old@example.com");
    expect(request.requestedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(request.requestedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("loads from db with provided values", () => {
    const requestedAt = new Date("2026-05-02T10:00:00Z");
    const request = EmailChangeRequest.loadFromDb({
      id: "req-1",
      userId: "user-1",
      newEmail: "new@example.com",
      previousEmail: "old@example.com",
      requestedAt,
    });

    expect(request.id).toBe("req-1");
    expect(request.userId).toBe("user-1");
    expect(request.newEmail).toBe("new@example.com");
    expect(request.previousEmail).toBe("old@example.com");
    expect(request.requestedAt).toBe(requestedAt);
  });

  it("rejects empty userId", () => {
    expect(() =>
      EmailChangeRequest.create({
        userId: "",
        newEmail: "new@example.com",
        previousEmail: "old@example.com",
      }),
    ).toThrow(ValueError);
  });

  it("rejects empty newEmail", () => {
    expect(() =>
      EmailChangeRequest.create({
        userId: "user-1",
        newEmail: "",
        previousEmail: "old@example.com",
      }),
    ).toThrow(ValueError);
  });

  it("rejects empty previousEmail", () => {
    expect(() =>
      EmailChangeRequest.create({
        userId: "user-1",
        newEmail: "new@example.com",
        previousEmail: "",
      }),
    ).toThrow(ValueError);
  });

  describe("generateNotificationEmail", () => {
    const request = EmailChangeRequest.create({
      userId: "user-1",
      newEmail: "new@example.com",
      previousEmail: "old@example.com",
    });

    it("addresses the previous email and maps request fields into template properties", () => {
      const mail = request.generateNotificationEmail({
        firstName: "Ada",
        revokeUrl: "https://app/revoke?token=abc",
        language: "de",
      });

      expect(mail.to).toBe("old@example.com");
      expect(mail.language).toBe("de");
      const props = mail.templateProperties as {
        firstName: string;
        currentEmail: string;
        newEmail: string;
        revokeUrl: string;
      };
      expect(props.firstName).toBe("Ada");
      expect(props.currentEmail).toBe("old@example.com");
      expect(props.newEmail).toBe("new@example.com");
      expect(props.revokeUrl).toBe("https://app/revoke?token=abc");
    });

    it("defaults firstName to User and language to en", () => {
      const mail = request.generateNotificationEmail({
        firstName: null,
        revokeUrl: "https://app/revoke?token=abc",
      });

      expect(mail.language).toBe("en");
      expect((mail.templateProperties as { firstName: string }).firstName).toBe("User");
    });
  });
});
