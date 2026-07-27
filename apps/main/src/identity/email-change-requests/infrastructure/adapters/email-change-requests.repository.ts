import type { Connection } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { EmailChangeRequest } from "../../domain/email-change-request";
import {
  EmailChangeRequestMapper,
  EmailChangeRequestPersistence,
} from "../mappers/email-change-request.mapper";
import {
  EmailChangeRequestDocument,
  EmailChangeRequest as EmailChangeRequestSchemaClass,
  EmailChangeRequestSchemaVersion,
} from "../schemas/email-change-request.schema";

@Injectable()
export class EmailChangeRequestsRepository {
  constructor(
    @InjectModel(EmailChangeRequestSchemaClass.name)
    private readonly model: Model<EmailChangeRequestDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async upsertByUserId(request: EmailChangeRequest): Promise<EmailChangeRequest> {
    const persistence = EmailChangeRequestMapper.toPersistence(request);
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.model.deleteOne({ userId: { $eq: request.userId } }, { session });
        await this.model.create(
          [
            {
              ...persistence,
              _schemaVersion: EmailChangeRequestSchemaVersion.v1_0_0,
            },
          ],
          { session },
        );
      });
      return request;
    } finally {
      await session.endSession();
    }
  }

  async findByUserId(userId: string): Promise<EmailChangeRequest | null> {
    const doc = await this.model
      .findOne({ userId: { $eq: userId } })
      .lean()
      .exec();
    if (!doc) {
      return null;
    }
    return EmailChangeRequestMapper.toDomain(doc as EmailChangeRequestPersistence);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.model.deleteOne({ userId: { $eq: userId } }).exec();
  }
}
