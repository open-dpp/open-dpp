import type { PendingEmailChangeDto } from "@open-dpp/dto";
import { EmailChangeRequest } from "../../domain/email-change-request";

export interface EmailChangeRequestPersistence {
  _id: string;
  userId: string;
  newEmail: string;
  previousEmail: string;
  requestedAt: Date;
}

export class EmailChangeRequestMapper {
  static toPersistence(entity: EmailChangeRequest): EmailChangeRequestPersistence {
    return {
      _id: entity.id,
      userId: entity.userId,
      newEmail: entity.newEmail,
      previousEmail: entity.previousEmail,
      requestedAt: entity.requestedAt,
    };
  }

  static toDomain(persistence: EmailChangeRequestPersistence): EmailChangeRequest {
    return EmailChangeRequest.loadFromDb({
      id: persistence._id,
      userId: persistence.userId,
      newEmail: persistence.newEmail,
      previousEmail: persistence.previousEmail,
      requestedAt: persistence.requestedAt,
    });
  }

  static toDto(entity: EmailChangeRequest): PendingEmailChangeDto {
    return {
      newEmail: entity.newEmail,
      requestedAt: entity.requestedAt,
    };
  }
}
