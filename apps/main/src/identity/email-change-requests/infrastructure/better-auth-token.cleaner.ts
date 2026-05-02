import { Inject, Injectable, Logger } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { Connection, mongo } from "mongoose";

const VERIFICATION_COLLECTION = "verification";
const CHANGE_EMAIL_IDENTIFIER_PREFIX = "change-email";

/**
 * Deletes pending change-email verification tokens from better-auth's
 * `verification` collection. Better-auth stores verification rows with an
 * `identifier` that includes the user id and a `value` containing the new
 * email; the safe filter is `identifier` matching this user's change-email
 * request prefix.
 *
 * The actual prefix should be verified by inspecting one verification row
 * produced by `auth.api.changeEmail` in development. This implementation
 * assumes the prefix is `change-email`; adjust if your better-auth version
 * differs.
 */
@Injectable()
export class BetterAuthTokenCleaner {
  private readonly logger = new Logger(BetterAuthTokenCleaner.name);
  private readonly db: mongo.Db;

  constructor(@Inject(getConnectionToken()) connectionOrDb: Connection | mongo.Db) {
    const maybeConnection = connectionOrDb as Connection;
    this.db =
      (maybeConnection.db as mongo.Db | undefined) ?? (connectionOrDb as mongo.Db);
  }

  async invalidateChangeEmailTokens(userId: string): Promise<void> {
    try {
      await this.db.collection(VERIFICATION_COLLECTION).deleteMany({
        identifier: { $regex: `^${CHANGE_EMAIL_IDENTIFIER_PREFIX}.*${userId}` },
      });
    } catch (error) {
      this.logger.error(
        `Failed to invalidate change-email verification tokens for user ${userId}`,
        error,
      );
      throw error;
    }
  }
}
