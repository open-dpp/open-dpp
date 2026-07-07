import type { Document, WithId } from "mongodb";
import { Invitation, InvitationDbProps } from "../../domain/invitation";
import { InvitationStatus } from "../../domain/invitation-status.enum";
import { MemberRoleEnum } from "../../domain/member-role.enum";

export class InvitationMapper {
  // Maps raw MongoDB documents (no Mongoose hydration): better-auth stores
  // invitation _ids as 32-char strings and reference fields as ObjectId,
  // so ids are normalized to strings and field types asserted here
  static toDomain(rawDoc: WithId<Document>): Invitation {
    const props: InvitationDbProps = {
      id: rawDoc._id.toString(),
      email: rawDoc.email as string,
      organizationId: rawDoc.organizationId?.toString() ?? "",
      inviterId: rawDoc.inviterId?.toString() ?? "",
      role: MemberRoleEnum.parse(rawDoc.role),
      status: rawDoc.status as InvitationStatus,
      createdAt: rawDoc.createdAt as Date,
      expiresAt: rawDoc.expiresAt as Date,
    };
    return Invitation.loadFromDb(props);
  }
}
