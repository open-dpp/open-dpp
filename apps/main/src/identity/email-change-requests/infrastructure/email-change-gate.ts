import type { Collection, Db } from "mongodb";
import { EMAIL_CHANGE_REQUEST_COLLECTION } from "./schemas/email-change-request.schema";

interface EmailChangeRequestRow {
  _id: string;
  userId: string;
  newEmail: string;
  previousEmail: string;
  requestedAt: Date;
}

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

export async function deletePendingEmailChangeForUser(
  db: Db | Collection<EmailChangeRequestRow>,
  userId: string,
): Promise<void> {
  await collection(db).deleteOne({ userId: { $eq: userId } });
}
