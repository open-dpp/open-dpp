import { describe, expect, it } from "@jest/globals";
import { EmailChangeRequest } from "./email-change-request";

describe("EmailChangeRequest", () => {
  it("creates with a generated id and current timestamp", () => {
    const before = new Date();
    const request = EmailChangeRequest.create({
      userId: "user-1",
      newEmail: "new@example.com",
    });
    const after = new Date();

    expect(request.id).toEqual(expect.any(String));
    expect(request.userId).toBe("user-1");
    expect(request.newEmail).toBe("new@example.com");
    expect(request.requestedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(request.requestedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("loads from db with provided values", () => {
    const requestedAt = new Date("2026-05-02T10:00:00Z");
    const request = EmailChangeRequest.loadFromDb({
      id: "req-1",
      userId: "user-1",
      newEmail: "new@example.com",
      requestedAt,
    });

    expect(request.id).toBe("req-1");
    expect(request.userId).toBe("user-1");
    expect(request.newEmail).toBe("new@example.com");
    expect(request.requestedAt).toBe(requestedAt);
  });

  it("rejects empty userId", () => {
    expect(() => EmailChangeRequest.create({ userId: "", newEmail: "new@example.com" })).toThrow();
  });

  it("rejects empty newEmail", () => {
    expect(() => EmailChangeRequest.create({ userId: "user-1", newEmail: "" })).toThrow();
  });
});
