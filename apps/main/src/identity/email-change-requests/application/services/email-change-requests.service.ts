import type { Auth } from "better-auth";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { ValueError } from "@open-dpp/exception";
import { AUTH } from "../../../auth/auth.provider";
import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";
import { EmailChangeRequest } from "../../domain/email-change-request";
import { EmailChangeRequestsRepository } from "../../infrastructure/adapters/email-change-requests.repository";

@Injectable()
export class EmailChangeRequestsService {
  private readonly logger = new Logger(EmailChangeRequestsService.name);

  constructor(
    private readonly repository: EmailChangeRequestsRepository,
    @Inject(AUTH) private readonly auth: Auth,
    private readonly envService: EnvService,
  ) {}

  async findByUserId(userId: string): Promise<EmailChangeRequest | null> {
    return this.repository.findByUserId(userId);
  }

  async hardCancel(userId: string): Promise<void> {
    await this.repository.deleteByUserId(userId);
  }

  async request(
    userId: string,
    newEmail: string,
    currentEmail: string,
    currentPassword: string,
    headers: BetterAuthHeaders,
  ): Promise<EmailChangeRequest> {
    if (newEmail === currentEmail) {
      throw new ValueError("New email must differ from the current email");
    }

    await this.verifyCurrentPassword(currentEmail, currentPassword, userId);

    const next = EmailChangeRequest.create({ userId, newEmail });
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
        `request: better-auth.changeEmail failed for ${userId}; rolling back shadow row`,
        error,
      );
      await this.repository.deleteByUserId(userId);
      throw error;
    }

    return next;
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
