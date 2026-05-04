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
    // Deleting the shadow row is sufficient: better-auth's change-email JWT is
    // stateless, so we cannot invalidate it directly. The user.update.before
    // hook in auth.provider.ts gates the actual email mutation on the presence
    // of this row, so a deleted row reliably blocks completion of a revoked
    // change.
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

    try {
      await this.auth.api.signInEmail({
        body: { email: currentEmail, password: currentPassword },
      });
    } catch {
      throw new ValueError("Current password is incorrect");
    }

    const existing = await this.repository.findByUserId(userId);
    if (existing) {
      await this.hardCancel(userId);
    }

    const next = EmailChangeRequest.create({ userId, newEmail });
    await this.repository.save(next);

    try {
      await this.auth.api.changeEmail({
        body: {
          newEmail,
          callbackURL: `${this.envService.get("OPEN_DPP_URL")}/profile`,
        },
        headers,
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
}
