import { APIError } from "better-auth";

/** The better-auth endpoint a visitor registers through; the only path that asks for consent. */
export const SIGN_UP_EMAIL_PATH = "/sign-up/email";

/** The parts of the better-auth endpoint context a `user.create.before` hook reads. */
export interface LegalConsentHookContext {
  path?: string;
  body?: unknown;
}

function acceptedTerms(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as { termsAccepted?: unknown }).termsAccepted === true
  );
}

/**
 * better-auth `databaseHooks.user.create.before`: while the instance links terms of service or a
 * privacy policy, self sign-up requires the visitor to accept them. The sign-up body carries
 * `termsAccepted: true`; it is not a user field and is never persisted. An accepted sign-up gets a
 * server-set `termsAcceptedAt`. Users created any other way (admin endpoints, the seeded admin)
 * pass through untouched. Returns a new record; the input is never mutated.
 */
export function applyLegalConsent<T extends object>(
  user: T,
  context: LegalConsentHookContext | null | undefined,
  consentRequired: boolean,
  now: () => Date = () => new Date(),
): { data: T & { termsAcceptedAt?: Date } } {
  if (!consentRequired || context?.path !== SIGN_UP_EMAIL_PATH) {
    return { data: { ...user } };
  }
  if (!acceptedTerms(context.body)) {
    throw APIError.from("BAD_REQUEST", {
      code: "TERMS_NOT_ACCEPTED",
      message: "The terms of service and privacy policy must be accepted to sign up",
    });
  }
  return { data: { ...user, termsAcceptedAt: now() } };
}
