import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Invitation } from "../../domain/invitation";
import { InvitationMapper } from "../mappers/invitation.mapper";
import { Invitation as InvitationSchema } from "../schemas/invitation.schema";

@Injectable()
export class InvitationsRepository {
  constructor(
    @InjectModel(InvitationSchema.name)
    private readonly invitationModel: Model<InvitationSchema>,
  ) { }

  async findOneById(id: string): Promise<Invitation | null> {
    const document = await this.invitationModel.findById(id);
    if (!document)
      return null;
    return InvitationMapper.toDomain(document);
  }

  async findOneUnexpiredByEmailAndOrganization(email: string, organizationId: string): Promise<Invitation | null> {
    const document = await this.invitationModel
      .findOne({ email, organizationId, expiresAt: { $gte: new Date() }, status: "pending" });
    if (!document)
      return null;
    return InvitationMapper.toDomain(document);
  }
}
