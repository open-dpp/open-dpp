import type { Collection, Db } from "mongodb";
import { EMAIL_CHANGE_REQUEST_COLLECTION } from "./schemas/email-change-request.schema";

/**
 * Shared access to the Email Change Request collection used to gate better-auth's
 * `user.email` update (see ADR-0001). The gate's collection access lives here, in one
 * helper, instead of being scattered as raw `db.collection(...)` queries across the
 * better-auth factory hooks. This module is the single source of truth for the persisted
 * field names of an Email Change Request row.
 */

/**
 * The raw persistence shape of an Email Change Request row, as stored in MongoDB.
 * Mirrors `EmailChangeRequestMapper`'s persistence shape; kept here so the gate hooks
 * never reference field names as string literals.
 */
interface EmailChangeRequestRow {
  _id: string;
  userId: string;
  newEmail: string;
  previousEmail: string;
  requestedAt: Date;
}

/**
 * The view of a pending Email Change Request returned to the gate hooks. `id` is the
 * row's `_id`; `previousEmail` is persisted so the `after` hook does not re-parse the
 * verification token.
 */
export interface PendingEmailChange {
  id: string;
  userId: string;
  newEmail: string;
  previousEmail: string;
  requestedAt: Date;
}

function collection(db: Db | Collection<EmailChangeRequestRow>): Collection<EmailChangeRequestRow> {
  return "collection" in db
    ? db.collection<EmailChangeRequestRow>(EMAIL_CHANGE_REQUEST_COLLECTION)
    : db;
}

/**
 * Loads the single outstanding Email Change Request for `userId`, or `null` if none exists.
 *
 * `userId` is matched with `$eq` so an operator-shaped value (e.g. `{ $ne: null }`) cannot
 * be smuggled in as a query operator.
 */
export async function findPendingEmailChangeForUser(
  db: Db | Collection<EmailChangeRequestRow>,
  userId: string,
): Promise<PendingEmailChange | null> {
  const row = await collection(db).findOne({ userId: { $eq: userId } });
  if (!row) {
    return null;
  }
  return {
    id: row._id,
    userId: row.userId,
    newEmail: row.newEmail,
    previousEmail: row.previousEmail,
    requestedAt: row.requestedAt,
  };
}

/**
 * Deletes the outstanding Email Change Request for `userId`. No-op when none exists.
 *
 * `userId` is matched with `$eq` for the same NoSQL-injection-defense reason as the lookup.
 */
export async function deletePendingEmailChangeForUser(
  db: Db | Collection<EmailChangeRequestRow>,
  userId: string,
): Promise<void> {
  await collection(db).deleteOne({ userId: { $eq: userId } });
}
