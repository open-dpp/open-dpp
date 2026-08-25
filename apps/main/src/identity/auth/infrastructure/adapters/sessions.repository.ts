import { Inject, Injectable } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { type Connection, Types } from "mongoose";

const SESSION_COLLECTION = "session";

@Injectable()
export class SessionsRepository {
  constructor(
    @Inject(getConnectionToken())
    private readonly connection: Connection,
  ) {}

  /**
   * Clears activeOrganizationId on every session of the user that points at the
   * given organization. Uses the raw mongodb driver because better-auth writes
   * the session collection itself and stores reference ids with its own types
   * (see active-organization-gate.ts); userId is matched in both string and
   * ObjectId form to be robust against either representation.
   */
  async clearActiveOrganization(userId: string, organizationId: string): Promise<void> {
    const db = this.connection.db;
    if (!db) {
      throw new Error("Mongoose connection has no database handle");
    }
    const userIdValues: (string | Types.ObjectId)[] = [userId];
    if (Types.ObjectId.isValid(userId)) {
      userIdValues.push(new Types.ObjectId(userId));
    }
    await db.collection(SESSION_COLLECTION).updateMany(
      {
        userId: { $in: userIdValues },
        activeOrganizationId: { $eq: organizationId },
      },
      { $set: { activeOrganizationId: null } },
    );
  }
}
