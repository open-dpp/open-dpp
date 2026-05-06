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

  it("rejects an invalid email", () => {
    expect(() =>
      RequestEmailChangeDtoSchema.parse({
        newEmail: "not-an-email",
        currentPassword: "hunter2",
      }),
    ).toThrow();
  });
});
