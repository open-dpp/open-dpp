import type { Auth } from "better-auth";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { ValueError } from "@open-dpp/exception";
import { EmailChangeNotificationMail } from "../../../../email/domain/email-change-notification-mail";
import { EmailService } from "../../../../email/email.service";
import { AUTH } from "../../../auth/auth.provider";
import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";
import { EmailChangeRequest } from "../../domain/email-change-request";
import { signRevokeToken } from "../../domain/revoke-token";
import { EmailChangeRequestsRepository } from "../../infrastructure/adapters/email-change-requests.repository";

// Lifetime of the revoke token embedded in the "your email is being changed" notification.
// Independent of the verification-token / shadow-row TTL: the revoke link should stay usable
// for a while after the request lapses so a user can still neutralize an unwanted change.
const REVOKE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * The subset of a User the email-change use case needs. Accepting this rather than the full
 * User entity keeps the service decoupled from the users module while letting a User be
 * passed directly.
 */
export interface EmailChangeRequester {
  id: string;
  email: string;
  firstName: string | null;
}

@Injectable()
export class EmailChangeRequestsService {
  private readonly logger = new Logger(EmailChangeRequestsService.name);

  constructor(
    private readonly repository: EmailChangeRequestsRepository,
    @Inject(AUTH) private readonly auth: Auth,
    private readonly envService: EnvService,
    private readonly emailService: EmailService,
  ) {}

  async findByUserId(userId: string): Promise<EmailChangeRequest | null> {
    return this.repository.findByUserId(userId);
  }

  async hardCancel(userId: string): Promise<void> {
    await this.repository.deleteByUserId(userId);
  }

  /**
   * Owns the full "request an email change" use case: it verifies the requester's password,
   * records the authorizing Email Change Request (carrying `previousEmail`), kicks off
   * better-auth's verification flow, and sends the revoke-notification to the *current*
   * address. Any failure after the row is written rolls the row back so no orphaned pending
   * change is left behind.
   */
  async request(
    user: EmailChangeRequester,
    newEmail: string,
    currentPassword: string,
    headers: BetterAuthHeaders,
  ): Promise<EmailChangeRequest> {
    const currentEmail = user.email;
    if (newEmail === currentEmail) {
      throw new ValueError("New email must differ from the current email");
    }

    await this.verifyCurrentPassword(currentEmail, currentPassword, user.id);

    const next = EmailChangeRequest.create({
      userId: user.id,
      newEmail,
      previousEmail: currentEmail,
    });
    await this.repository.upsertByUserId(next);

    try {
      await this.auth.api.changeEmail({
        body: {
          newEmail,
          callbackURL: `${this.envService.get("OPEN_DPP_URL")}/profile`,
        },
        // BetterAuthHeaders is an interface (no implicit index signature), so it is not
        // directly assignable to better-auth's `HeadersInit`. The cast is runtime-safe:
        // extractBetterAuthHeaders only ever populates string values.
        headers: headers as Record<string, string>,
      });
    } catch (error) {
      this.logger.error(
        `request: better-auth.changeEmail failed for ${user.id}; rolling back shadow row`,
        error,
      );
      await this.repository.deleteByUserId(user.id);
      throw error;
    }

    await this.sendNotification(user, next, newEmail);

    return next;
  }

  private async sendNotification(
    user: EmailChangeRequester,
    request: EmailChangeRequest,
    newEmail: string,
  ): Promise<void> {
    const revokeToken = signRevokeToken(
      { userId: user.id, requestId: request.id },
      this.envService.get("OPEN_DPP_AUTH_SECRET"),
      REVOKE_TOKEN_TTL_MS,
    );
    const revokeUrl = `${this.envService.get("OPEN_DPP_URL")}/api/users/email-change/revoke?token=${encodeURIComponent(revokeToken)}`;

    try {
      await this.emailService.send(
        EmailChangeNotificationMail.create({
          to: user.email,
          subject: "Your email is being changed",
          templateProperties: {
            firstName: user.firstName ?? "User",
            currentEmail: user.email,
            newEmail,
            revokeUrl,
          },
        }),
      );
    } catch (error) {
      this.logger.error(
        `request: failed to send email-change notification to ${user.email} for user ${user.id}; rolling back pending change`,
        error,
      );
      await this.hardCancel(user.id);
      throw error;
    }
  }

  private async verifyCurrentPassword(
    currentEmail: string,
    currentPassword: string,
    userId: string,
  ): Promise<void> {
    let isValid = false;
    try {
      const context = await this.auth.$context;
      const found = await context.internalAdapter.findUserByEmail(currentEmail, {
        includeAccounts: true,
      });
      // Bind verification to the target user: only trust the credential account when the
      // email resolves to the user whose email is being changed. Otherwise a mismatched
      // currentEmail/userId would verify the password against a different user's account.
      const credentialAccount =
        found?.user?.id === userId
          ? found.accounts?.find(
              (account) => account.providerId === "credential" && account.password,
            )
          : undefined;
      if (credentialAccount?.password) {
        isValid = await context.password.verify({
          hash: credentialAccount.password,
          password: currentPassword,
        });
      }
    } catch (error) {
      this.logger.error(`request: password verification failed for ${userId}`, error);
      throw error;
    }

    if (!isValid) {
      throw new ValueError("Current password is incorrect");
    }
  }
}
