import { expect } from "@jest/globals";
import { Language } from "../aas/enums/language-enum";
import { MeDtoSchema } from "./me.dto";

describe("MeDtoSchema", () => {
  it("parses a response with no pending change", () => {
    const parsed = MeDtoSchema.parse({
      user: {
        id: "user-1",
        email: "u@example.com",
        firstName: "U",
        lastName: "Ser",
        name: "U Ser",
        image: null,
        emailVerified: true,
        preferredLanguage: Language.en,
        createdAt: "2026-05-02T10:00:00Z",
        updatedAt: "2026-05-02T10:00:00Z",
      },
      pendingEmailChange: null,
    });
    expect(parsed.pendingEmailChange).toBeNull();
  });

  it("parses a response with a pending change", () => {
    const parsed = MeDtoSchema.parse({
      user: {
        id: "user-1",
        email: "u@example.com",
        firstName: "U",
        lastName: "Ser",
        name: "U Ser",
        image: null,
        emailVerified: true,
        preferredLanguage: Language.en,
        createdAt: "2026-05-02T10:00:00Z",
        updatedAt: "2026-05-02T10:00:00Z",
      },
      pendingEmailChange: {
        newEmail: "new@example.com",
        requestedAt: "2026-05-02T11:00:00Z",
      },
    });
    expect(parsed.pendingEmailChange?.newEmail).toBe("new@example.com");
  });
});
