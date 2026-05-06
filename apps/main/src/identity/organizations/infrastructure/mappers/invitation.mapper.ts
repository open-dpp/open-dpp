import { Invitation, InvitationDbProps } from "../../domain/invitation";
import { InvitationStatus } from "../../domain/invitation-status.enum";
import { InvitationDocument } from "../schemas/invitation.schema";

export class InvitationMapper {
  static toDomain(document: InvitationDocument): Invitation {
    const props: InvitationDbProps = {
      id: document._id.toString(),
      email: document.email,
      organizationId: document.organizationId,
      inviterId: document.inviterId,
      role: document.role,
      status: document.status as InvitationStatus,
      createdAt: document.createdAt,
      expiresAt: document.expiresAt,
    };
    return Invitation.loadFromDb(props);
  }
}
