import { expect } from "@jest/globals";
import { UserDtoSchema } from "./user.dto";

const validBase = {
  id: "user-1",
  email: "user@example.com",
  firstName: "Jane",
  lastName: "Roe",
  name: "Jane Roe",
  image: null,
  emailVerified: true,
  preferredLanguage: "en",
  pendingEmail: null,
  pendingEmailRequestedAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-02T00:00:00Z"),
};

describe("userDto", () => {
  it("accepts a fully populated user", () => {
    const result = UserDtoSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("accepts null firstName, lastName, name, and image", () => {
    const result = UserDtoSchema.safeParse({
      ...validBase,
      firstName: null,
      lastName: null,
      name: null,
      image: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects undefined firstName (must always be present)", () => {
    const { firstName, ...rest } = validBase;
    void firstName;
    const result = UserDtoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects undefined preferredLanguage (must always be present)", () => {
    const { preferredLanguage, ...rest } = validBase;
    void preferredLanguage;
    const result = UserDtoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects unsupported preferredLanguage values", () => {
    const result = UserDtoSchema.safeParse({ ...validBase, preferredLanguage: "fr" });
    expect(result.success).toBe(false);
  });

  it("coerces ISO date strings to Date objects", () => {
    const result = UserDtoSchema.safeParse({
      ...validBase,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.createdAt).toBeInstanceOf(Date);
      expect(result.data.updatedAt).toBeInstanceOf(Date);
    }
  });

  it("accepts a pending email change (string + ISO date)", () => {
    const result = UserDtoSchema.safeParse({
      ...validBase,
      pendingEmail: "new@example.com",
      pendingEmailRequestedAt: "2026-04-30T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pendingEmail).toBe("new@example.com");
      expect(result.data.pendingEmailRequestedAt).toBeInstanceOf(Date);
    }
  });

  it("rejects undefined pendingEmail (must always be present, may be null)", () => {
    const { pendingEmail, ...rest } = validBase;
    void pendingEmail;
    const result = UserDtoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects undefined pendingEmailRequestedAt (must always be present, may be null)", () => {
    const { pendingEmailRequestedAt, ...rest } = validBase;
    void pendingEmailRequestedAt;
    const result = UserDtoSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
