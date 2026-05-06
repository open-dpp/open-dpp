import { expect } from "@jest/globals";
import { PendingEmailChangeDtoSchema } from "./pending-email-change.dto";

describe("PendingEmailChangeDtoSchema", () => {
  it("parses a valid pending change", () => {
    const parsed = PendingEmailChangeDtoSchema.parse({
      newEmail: "new@example.com",
      requestedAt: "2026-05-02T10:00:00Z",
    });
    expect(parsed.newEmail).toBe("new@example.com");
    expect(parsed.requestedAt).toBeInstanceOf(Date);
  });

  it("rejects an invalid email", () => {
    expect(() =>
      PendingEmailChangeDtoSchema.parse({
        newEmail: "not-an-email",
        requestedAt: "2026-05-02T10:00:00Z",
      }),
    ).toThrow();
  });
});
