import type { Auth } from "better-auth";
import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { AUTH } from "../../../auth/auth.provider";
import { Invitation } from "../../domain/invitation";
import { InvitationStatus } from "../../domain/invitation-status.enum";
import { MemberRole } from "../../domain/member-role.enum";
import { InvitationMapper } from "../mappers/invitation.mapper";
import { Invitation as InvitationSchema } from "../schemas/invitation.schema";

@Injectable()
export class InvitationsRepository {
  constructor(
    @InjectModel(InvitationSchema.name)
    private readonly invitationModel: Model<InvitationSchema>,
    @Inject(AUTH) private readonly auth: Auth,
  ) { }

  async findOneById(id: string): Promise<Invitation | null> {
    const document = await this.invitationModel.findById(id);
    if (!document)
      return null;
    return InvitationMapper.toDomain(document);
  }

  async findOneUnexpiredByEmailAndOrganization(email: string, organizationId: string): Promise<Invitation | null> {
    // Query the raw MongoDB collection to bypass Mongoose's String schema casting,
    // since Better Auth's MongoDB adapter stores reference fields as ObjectId
    const orgIdFilter = ObjectId.isValid(organizationId)
      ? { $in: [organizationId, new ObjectId(organizationId)] }
      : organizationId;
    const rawDoc = await this.invitationModel.collection.findOne({
      email,
      organizationId: orgIdFilter,
      expiresAt: { $gte: new Date() },
      status: InvitationStatus.PENDING,
    });
    if (!rawDoc)
      return null;
    return Invitation.loadFromDb({
      id: rawDoc._id.toString(),
      email: rawDoc.email as string,
      organizationId: rawDoc.organizationId?.toString() ?? "",
      inviterId: rawDoc.inviterId?.toString() ?? "",
      role: rawDoc.role as MemberRole,
      status: rawDoc.status as InvitationStatus,
      createdAt: rawDoc.createdAt as Date,
      expiresAt: rawDoc.expiresAt as Date,
    });
  }

  async save(invitation: Invitation, headers?: BetterAuthHeaders): Promise<void> {
    await (this.auth.api as any).createInvitation({
      headers,
      body: {
        email: invitation.email,
        role: invitation.role,
        organizationId: invitation.organizationId,
      },
    });
  }
}
