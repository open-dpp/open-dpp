import type { Logger } from "@nestjs/common";
import type { Db } from "mongodb";
import { idFilter } from "../../lib/better-auth-id";

const USER_COLLECTION = "user";

export interface SessionActivity {
  userId: string;
  updatedAt: Date;
  impersonatedBy?: string | null;
}

/**
 * Better-auth `session.create.after` / `session.update.after` hook body.
 * `updatedAt` is set when a session is created and bumped on every refresh,
 * so users who stay signed in still advance their `lastLoginAt`. The update
 * hook receives `null` when the session vanished mid-update, hence the guard.
 * Failures are logged, never thrown, so they cannot block sign-in.
 */
export async function recordLastLogin(
  db: Db,
  logger: Logger,
  session: SessionActivity | null,
): Promise<void> {
  if (!session || session.impersonatedBy) {
    return;
  }
  try {
    await db
      .collection(USER_COLLECTION)
      .updateOne(
        { _id: idFilter(session.userId) as any },
        { $max: { lastLoginAt: session.updatedAt } },
      );
  } catch (error) {
    logger.error("Failed to record last login", error);
  }
}
