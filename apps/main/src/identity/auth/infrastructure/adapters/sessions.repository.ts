import { Inject, Injectable } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { type Connection, Types } from "mongoose";
import { SESSION_COLLECTION } from "../schemas/session.schema";

@Injectable()
export class SessionsRepository {
  constructor(
    @Inject(getConnectionToken())
    private readonly connection: Connection,
  ) {}

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
