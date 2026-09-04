import type { Collection, Db } from "mongodb";
import { Types } from "mongoose";
import { idFilter } from "../../lib/better-auth-id";

const MEMBER_COLLECTION = "member";

interface MemberRow {
  userId: Types.ObjectId | string;
  organizationId?: Types.ObjectId;
  createdAt: Date;
}

function collection(db: Db | Collection<MemberRow>): Collection<MemberRow> {
  return "collection" in db ? db.collection<MemberRow>(MEMBER_COLLECTION) : db;
}

/**
 * Resolves the active organization for a fresh session: the user's earliest
 * membership (sorted by createdAt asc). Returns the organizationId as a string,
 * or undefined when the user belongs to no organization.
 *
 * Lives here as a free function (not on MembersRepository) because better-auth's
 * session-create hook only has the native mongodb `Db`, not the Nest DI graph.
 * Mirrors email-change-gate. `idFilter` matches both id storage forms and
 * neutralizes operator-shaped userId injection; the returned id is stringified
 * so it reaches the frontend as a string rather than a Mongo ObjectId Buffer.
 */
export async function findActiveOrganizationIdForUser(
  db: Db | Collection<MemberRow>,
  userId: string,
): Promise<string | undefined> {
  const member = await collection(db).findOne(
    { userId: idFilter(userId) },
    { sort: { createdAt: 1 } },
  );
  return member?.organizationId ? member.organizationId.toString() : undefined;
}
