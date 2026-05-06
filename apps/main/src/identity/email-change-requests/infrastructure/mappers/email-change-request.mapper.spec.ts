import { describe, expect, it } from "@jest/globals";
import { EmailChangeRequest } from "../../domain/email-change-request";
import { EmailChangeRequestMapper } from "./email-change-request.mapper";

describe("EmailChangeRequestMapper", () => {
  it("round-trips entity through plain and back", () => {
    const original = EmailChangeRequest.loadFromDb({
      id: "req-1",
      userId: "user-1",
      newEmail: "new@example.com",
      requestedAt: new Date("2026-05-02T10:00:00Z"),
    });

    const plain = EmailChangeRequestMapper.toPersistence(original);
    expect(plain).toEqual({
      _id: "req-1",
      userId: "user-1",
      newEmail: "new@example.com",
      requestedAt: new Date("2026-05-02T10:00:00Z"),
    });

    const restored = EmailChangeRequestMapper.toDomain(plain);
    expect(restored.id).toBe(original.id);
    expect(restored.userId).toBe(original.userId);
    expect(restored.newEmail).toBe(original.newEmail);
    expect(restored.requestedAt.getTime()).toBe(original.requestedAt.getTime());
  });

  it("maps to DTO without internal fields", () => {
    const entity = EmailChangeRequest.loadFromDb({
      id: "req-1",
      userId: "user-1",
      newEmail: "new@example.com",
      requestedAt: new Date("2026-05-02T10:00:00Z"),
    });

    expect(EmailChangeRequestMapper.toDto(entity)).toEqual({
      newEmail: "new@example.com",
      requestedAt: new Date("2026-05-02T10:00:00Z"),
    });
  });
});
