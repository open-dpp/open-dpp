import type { Auth } from "better-auth";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { AUTH } from "../../../auth/auth.provider";
import { AccountsRepository } from "../../infrastructure/adapters/accounts.repository";

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    private readonly accountsRepository: AccountsRepository,
    @Inject(AUTH) private readonly auth: Auth,
  ) {}

  /**
   * Verifies `plaintext` against the User's password credential (see ADR-0002).
   *
   * Returns `false` when the User has no password credential or the password does not match.
   * Infrastructure failures (DB, hasher) are logged and re-thrown — never swallowed into `false` —
   * so an outage is not reported to the User as an incorrect password. The hash and the better-auth
   * verifier never leave this method.
   */
  async verifyPassword(userId: string, plaintext: string): Promise<boolean> {
    try {
      const account = await this.accountsRepository.findCredentialByUserId(userId);
      if (!account?.password) {
        return false;
      }
      const context = await this.auth.$context;
      return await context.password.verify({ hash: account.password, password: plaintext });
    } catch (error) {
      this.logger.error(`verifyPassword: credential verification failed for ${userId}`, error);
      throw error;
    }
  }
}
