import type { Logger } from "@nestjs/common";
import type { Db } from "mongodb";
import { z } from "zod";
import { EmailChangeCompletedMail } from "../../../email/domain/email-change-completed-mail";
import type { EmailService } from "../../../email/email.service";
import {
  deletePendingEmailChangeForUser,
  findPendingEmailChangeForUser,
} from "./email-change-gate";
import { DisplayLanguageType } from "@open-dpp/dto";

// Localized like the mjml template siblings (see EmailTemplate.localizedName).
const COMPLETED_SUBJECT_BY_LANGUAGE: Record<DisplayLanguageType, string> = {
  en: "Your email address was changed",
  de: "E-Mail-Adresse erfolgreich geändert",
};

export interface VerificationTokenPayload {
  email?: string;
  updateTo?: string;
}

/**
 * Structural shape of the better-auth user passed to the `user.update.after`
 * hook. Typed loosely on purpose: the better-auth `User` generic does not unify
 * across the import boundary (see auth.provider.ts), so we only require the
 * fields this hook actually reads.
 */
export interface EmailChangeUser {
  id: string;
  email: string;
  firstName?: string;
  preferredLanguage?: unknown;
}

export function resolveUserLanguage(user: unknown): DisplayLanguageType {
  const preferred = (user as { preferredLanguage?: unknown } | null | undefined)?.preferredLanguage;
  return preferred === "de" ? "de" : "en";
}

export function decodeVerificationToken(context: unknown): VerificationTokenPayload | undefined {
  const token = (context as { query?: { token?: unknown } } | null | undefined)?.query?.token;
  if (typeof token !== "string") {
    return undefined;
  }
  const segments = token.split(".");
  if (segments.length < 2) {
    return undefined;
  }
  try {
    const payload = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8")) as {
      email?: unknown;
      updateTo?: unknown;
    };
    return {
      email: typeof payload.email === "string" ? payload.email : undefined,
      updateTo: typeof payload.updateTo === "string" ? payload.updateTo : undefined,
    };
  } catch {
    return undefined;
  }
}

/**
 * Guards a better-auth `user.update` before it hits the DB. Returns `false` to
 * block the update when the email change cannot be tied back to a pending
 * EmailChangeRequest owned by the token's subject; returns `undefined` to let
 * non-email updates and legitimate confirmations proceed unchanged.
 *
 * Extracted from the auth provider so it can be unit-tested in isolation.
 */
export async function guardEmailChangeUpdate(
  db: Db,
  logger: Logger,
  data: unknown,
  context: unknown,
): Promise<false | undefined> {
  const parsed = z.object({ email: z.string() }).safeParse(data);
  if (!parsed.success) {
    return;
  }
  const newEmail = parsed.data.email;
  const previousEmail = decodeVerificationToken(context)?.email;
  if (!previousEmail) {
    logger.warn(
      `Blocked user.email update to ${newEmail}: could not resolve the originating user from the verification token`,
    );
    return false;
  }
  const targetUser = await db
    .collection("user")
    .findOne({ email: { $eq: previousEmail.toLowerCase() } });
  if (!targetUser) {
    logger.warn(
      `Blocked user.email update to ${newEmail}: no user matches the verification token's subject`,
    );
    return false;
  }
  const pending = await findPendingEmailChangeForUser(db, targetUser._id.toString());
  if (!pending || pending.newEmail !== newEmail) {
    logger.warn(
      `Blocked user.email update to ${newEmail}: no matching EmailChangeRequest for the token's subject (revoked, unknown, or belongs to a different user)`,
    );
    return false;
  }
}

/**
 * Runs after a verified email change lands: notifies the user at their new
 * address and clears the pending EmailChangeRequest. No-ops when the update was
 * not a tracked email change. All failures are logged and swallowed so a
 * notification/cleanup problem never rolls back the committed email change.
 *
 * Extracted from the auth provider so it can be unit-tested in isolation.
 */
export async function completeVerifiedEmailChange(
  db: Db,
  emailService: EmailService,
  logger: Logger,
  user: EmailChangeUser,
): Promise<void> {
  try {
    const pending = await findPendingEmailChangeForUser(db, user.id);
    if (!pending || pending.newEmail !== user.email) {
      return;
    }

    try {
      const language = resolveUserLanguage(user);
      await emailService.send(
        EmailChangeCompletedMail.create({
          to: user.email,
          subject: COMPLETED_SUBJECT_BY_LANGUAGE[language],
          language,
          templateProperties: {
            firstName: user.firstName ?? "User",
            previousEmail: pending.previousEmail,
            currentEmail: user.email,
          },
        }),
      );
    } catch (error) {
      logger.error(`Failed to send email-change-completed notification to ${user.email}`, error);
    }

    await deletePendingEmailChangeForUser(db, user.id);
  } catch (error) {
    logger.error("Failed to clear EmailChangeRequest after user.email update", error);
  }
}
