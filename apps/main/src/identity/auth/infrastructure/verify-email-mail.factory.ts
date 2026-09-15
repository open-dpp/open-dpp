import { DisplayLanguageType } from "@open-dpp/dto";
import { VerifyEmailMail } from "../../../email/domain/verify-email-mail";

// Localized like the mjml template siblings (see EmailTemplate.localizedName).
export const VERIFY_EMAIL_SUBJECT_BY_LANGUAGE: Record<DisplayLanguageType, string> = {
  en: "Verify E-Mail address",
  de: "E-Mail-Adresse bestätigen",
};

export interface VerifyEmailMailInput {
  to: string;
  firstName: string;
  language: DisplayLanguageType;
  /** better-auth `/verify-email` link, see EmailVerificationLinkBuilder. */
  link: string;
}

/**
 * The standard verification mail, built the same way wherever it is sent: by better-auth's
 * `sendVerificationEmail` callback (sign-up, `POST /users`, resend) and by owner provisioning,
 * which sends it directly so that a failure is observable (better-auth swallows callback errors).
 */
export function createVerifyEmailMail(input: VerifyEmailMailInput): VerifyEmailMail {
  return VerifyEmailMail.create({
    to: input.to,
    subject: VERIFY_EMAIL_SUBJECT_BY_LANGUAGE[input.language],
    language: input.language,
    templateProperties: { link: input.link, firstName: input.firstName },
  });
}
