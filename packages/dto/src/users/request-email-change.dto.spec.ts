import { expect } from "@jest/globals";
import { RequestEmailChangeDtoSchema } from "./request-email-change.dto";

describe("RequestEmailChangeDtoSchema", () => {
  it("parses a valid request", () => {
    const parsed = RequestEmailChangeDtoSchema.parse({
      newEmail: "new@example.com",
      currentPassword: "hunter2",
    });
    expect(parsed.newEmail).toBe("new@example.com");
    expect(parsed.currentPassword).toBe("hunter2");
  });

  it("normalizes the new email to lowercase", () => {
    const parsed = RequestEmailChangeDtoSchema.parse({
      newEmail: "John.Doe@Company.com",
      currentPassword: "hunter2",
    });
    expect(parsed.newEmail).toBe("john.doe@company.com");
  });

  it("rejects missing currentPassword", () => {
    expect(() => RequestEmailChangeDtoSchema.parse({ newEmail: "new@example.com" })).toThrow();
  });

  it("rejects empty currentPassword", () => {
    expect(() =>
      RequestEmailChangeDtoSchema.parse({
        newEmail: "new@example.com",
        currentPassword: "",
      }),
    ).toThrow();
  });

  it("accepts a currentPassword at the maximum length", () => {
    const parsed = RequestEmailChangeDtoSchema.parse({
      newEmail: "new@example.com",
      currentPassword: "a".repeat(1024),
    });
    expect(parsed.currentPassword).toBe("a".repeat(1024));
  });

  it("rejects a currentPassword longer than 1024 characters", () => {
    expect(() =>
      RequestEmailChangeDtoSchema.parse({
        newEmail: "new@example.com",
        currentPassword: "a".repeat(1025),
      }),
    ).toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() =>
      RequestEmailChangeDtoSchema.parse({
        newEmail: "not-an-email",
        currentPassword: "hunter2",
      }),
    ).toThrow();
  });
});
