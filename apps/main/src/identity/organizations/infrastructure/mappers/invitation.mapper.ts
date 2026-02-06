import { Invitation, InvitationDbProps } from "../../domain/invitation";
import { InvitationDocument, Invitation as InvitationSchema } from "../schemas/invitation.schema";

export class InvitationMapper {
  static toDomain(document: InvitationDocument): Invitation {
    const props: InvitationDbProps = {
      id: document._id,
      email: document.email,
      organizationId: document.organizationId,
      inviterId: document.inviterId,
      role: document.role,
      status: document.status,
      createdAt: document.createdAt,
      expiresAt: document.expiresAt,
    };
    return Invitation.loadFromDb(props);
  }

  static toPersistence(entity: Invitation): InvitationSchema {
    return {
      _id: entity.id,
      email: entity.email,
      organizationId: entity.organizationId,
      inviterId: entity.inviterId,
      role: entity.role,
      status: entity.status,
      createdAt: entity.createdAt,
      expiresAt: entity.expiresAt,
    } as InvitationSchema;
  }
}
