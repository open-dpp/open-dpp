import { APIError } from "better-auth";
import { describe, expect, it } from "vitest";
import { applyLegalConsent, SIGN_UP_EMAIL_PATH } from "./user-legal-consent-hook";

const acceptedAt = new Date("2026-11-11T10:00:00.000Z");
const now = () => acceptedAt;
const user = { email: "jane@example.com", firstName: "Jane" };

describe("applyLegalConsent", () => {
  it("records when a visitor accepted the terms at sign-up", () => {
    const result = applyLegalConsent(
      user,
      { path: SIGN_UP_EMAIL_PATH, body: { termsAccepted: true } },
      true,
      now,
    );

    expect(result).toEqual({ data: { ...user, termsAcceptedAt: acceptedAt } });
    expect(result.data).not.toBe(user);
    expect(user).not.toHaveProperty("termsAcceptedAt");
  });

  it.each([
    ["no flag", {}],
    ["a false flag", { termsAccepted: false }],
    ["a truthy non-boolean flag", { termsAccepted: "true" }],
    ["no body", undefined],
  ])("rejects a sign-up with %s while consent is required", (_, body) => {
    expect(() => applyLegalConsent(user, { path: SIGN_UP_EMAIL_PATH, body }, true, now)).toThrow(
      APIError,
    );
  });

  it("leaves sign-ups alone while no terms or privacy policy are linked", () => {
    expect(applyLegalConsent(user, { path: SIGN_UP_EMAIL_PATH, body: {} }, false, now)).toEqual({
      data: user,
    });
    expect(
      applyLegalConsent(user, { path: SIGN_UP_EMAIL_PATH, body: { termsAccepted: true } }, false),
    ).toEqual({ data: user });
  });

  it("leaves users created outside self sign-up alone", () => {
    expect(applyLegalConsent(user, { path: "/admin/create-user", body: {} }, true, now)).toEqual({
      data: user,
    });
    expect(applyLegalConsent(user, null, true, now)).toEqual({ data: user });
  });
});
