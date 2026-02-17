import type { Auth } from "better-auth";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AUTH } from "../../../auth/auth.provider";
import { Invitation } from "../../domain/invitation";
import { InvitationStatus } from "../../domain/invitation-status.enum";
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
    const document = await this.invitationModel
      .findOne({ email, organizationId, expiresAt: { $gte: new Date() }, status: InvitationStatus.PENDING });
    if (!document)
      return null;
    return InvitationMapper.toDomain(document);
  }

  async save(invitation: Invitation, headers?: Record<string, string> | Headers): Promise<void> {
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
