import type { Db } from "mongodb";
import { idFilter } from "../../lib/better-auth-id";

const USER_COLLECTION = "user";

export interface CreatedSession {
  userId: string;
  createdAt: Date;
  impersonatedBy?: string | null;
}

export async function recordLastLogin(db: Db, session: CreatedSession): Promise<void> {
  if (session.impersonatedBy) {
    return;
  }
  await db
    .collection(USER_COLLECTION)
    .updateOne(
      { _id: idFilter(session.userId) as any },
      { $set: { lastLoginAt: session.createdAt } },
    );
}
