import type { Document, WithId } from "mongodb";
import { Invitation, InvitationDbProps } from "../../domain/invitation";
import { InvitationStatus } from "../../domain/invitation-status.enum";
import { MemberRole, MemberRoleEnum } from "../../domain/member-role.enum";

export class InvitationMapper {
  // Maps raw MongoDB documents (no Mongoose hydration): better-auth stores
  // invitation _ids as 32-char strings and reference fields as ObjectId,
  // so ids are normalized to strings and field types asserted here
  static toDomain(rawDoc: WithId<Document>): Invitation {
    // handle better-auth 'admin' + other outdated roles leniently, mirrors member.ts;
    // role is not surfaced in the response DTO, so an unknown value must not throw
    const parsedRole = MemberRoleEnum.safeParse(rawDoc.role);
    const props: InvitationDbProps = {
      id: rawDoc._id.toString(),
      email: rawDoc.email as string,
      organizationId: rawDoc.organizationId?.toString() ?? "",
      inviterId: rawDoc.inviterId?.toString() ?? "",
      role: parsedRole.success ? parsedRole.data : MemberRole.MEMBER,
      status: rawDoc.status as InvitationStatus,
      createdAt: rawDoc.createdAt as Date,
      expiresAt: rawDoc.expiresAt as Date,
    };
    return Invitation.loadFromDb(props);
  }
}
