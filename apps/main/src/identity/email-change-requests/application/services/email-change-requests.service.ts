import type { Auth } from "better-auth";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { LatestApiVersionWithPrefixDto } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { ValueError } from "@open-dpp/exception";
import { EmailChangeNotificationMail } from "../../../../email/domain/email-change-notification-mail";
import { EmailService } from "../../../../email/email.service";
import { AccountsService } from "../../../accounts/application/services/accounts.service";
import { AUTH } from "../../../auth/auth.provider";
import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";
import { EmailChangeRequest } from "../../domain/email-change-request";
import { signRevokeToken } from "../../domain/revoke-token";
import { EmailChangeRequestsRepository } from "../../infrastructure/adapters/email-change-requests.repository";

const REVOKE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

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
    private readonly accountsService: AccountsService,
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

    const passwordValid = await this.accountsService.verifyPassword(user.id, currentPassword);
    if (!passwordValid) {
      throw new ValueError("Current password is incorrect");
    }

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
    const revokeUrl = `${this.envService.get("OPEN_DPP_URL")}/api/${LatestApiVersionWithPrefixDto}/users/email-change/revoke?token=${encodeURIComponent(revokeToken)}`;

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
}
