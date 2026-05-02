import type { Auth } from "better-auth";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { AUTH } from "../../../auth/auth.provider";
import { EmailChangeRequest } from "../../domain/email-change-request";
import { BetterAuthTokenCleaner } from "../../infrastructure/better-auth-token.cleaner";
import { EmailChangeRequestsRepository } from "../../infrastructure/adapters/email-change-requests.repository";

@Injectable()
export class EmailChangeRequestsService {
  private readonly logger = new Logger(EmailChangeRequestsService.name);

  constructor(
    private readonly repository: EmailChangeRequestsRepository,
    private readonly tokenCleaner: BetterAuthTokenCleaner,
    @Inject(AUTH) private readonly auth: Auth,
    private readonly envService: EnvService,
  ) {}

  async findByUserId(userId: string): Promise<EmailChangeRequest | null> {
    return this.repository.findByUserId(userId);
  }

  async hardCancel(userId: string): Promise<void> {
    await this.repository.deleteByUserId(userId);
    try {
      await this.tokenCleaner.invalidateChangeEmailTokens(userId);
    } catch (error) {
      this.logger.error(
        `hardCancel: token cleanup failed for ${userId}; row already deleted`,
        error,
      );
    }
  }
}
