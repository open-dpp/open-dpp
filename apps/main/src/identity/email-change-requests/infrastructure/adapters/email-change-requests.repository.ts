import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { EmailChangeRequest } from "../../domain/email-change-request";
import { EmailChangeRequestMapper } from "../mappers/email-change-request.mapper";
import {
  EmailChangeRequestDocument,
  EmailChangeRequest as EmailChangeRequestSchemaClass,
} from "../schemas/email-change-request.schema";

@Injectable()
export class EmailChangeRequestsRepository {
  constructor(
    @InjectModel(EmailChangeRequestSchemaClass.name)
    private readonly model: Model<EmailChangeRequestDocument>,
  ) {}

  async save(request: EmailChangeRequest): Promise<EmailChangeRequest> {
    const persistence = EmailChangeRequestMapper.toPersistence(request);
    await this.model.create(persistence);
    return request;
  }

  async findByUserId(userId: string): Promise<EmailChangeRequest | null> {
    const doc = await this.model.findOne({ userId }).lean().exec();
    if (!doc) {
      return null;
    }
    return EmailChangeRequestMapper.toDomain({
      _id: doc._id,
      userId: doc.userId,
      newEmail: doc.newEmail,
      requestedAt: doc.requestedAt,
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.model.deleteOne({ userId }).exec();
  }
}
