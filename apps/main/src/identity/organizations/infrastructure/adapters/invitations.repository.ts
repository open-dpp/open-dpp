import type { Auth } from "better-auth";
import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Document, Filter } from "mongodb";
import { Model } from "mongoose";
import { AUTH } from "../../../auth/auth.provider";
import { idFilter } from "../../../lib/better-auth-id";
import { Invitation } from "../../domain/invitation";
import { InvitationStatus } from "../../domain/invitation-status.enum";
import { InvitationMapper } from "../mappers/invitation.mapper";
import { InvitationDoc } from "../schemas/invitation.schema";
import { NotFoundInDatabaseException } from "@open-dpp/exception";

@Injectable()
export class InvitationsRepository {
  constructor(
    @InjectModel(InvitationDoc.name)
    private readonly invitationModel: Model<InvitationDoc>,
    @Inject(AUTH) private readonly auth: Auth,
  ) {}

  async findOneById(id: string): Promise<Invitation | null> {
    const rawDoc = await this.invitationModel.collection.findOne({
      _id: idFilter(id),
    } as unknown as Filter<Document>);
    if (!rawDoc) return null;
    return InvitationMapper.toDomain(rawDoc);
  }

  async findOneByIdOrFail(id: string): Promise<Invitation> {
    const invitation = await this.findOneById(id);
    if (!invitation) {
      throw new NotFoundInDatabaseException(Invitation.name);
    }
    return invitation;
  }

  // The `$eq` wrapper is a security guard against NoSQL operator injection:
  // it forces an operator-shaped `email` (e.g. `{ $ne: null }`) to be compared
  // as a literal value instead of being interpreted as a query operator.
  async findByEmail(email: string): Promise<Invitation[]> {
    const rawDocs = await this.invitationModel.collection.find({ email: { $eq: email } }).toArray();
    return rawDocs.map((rawDoc) => InvitationMapper.toDomain(rawDoc));
  }

  async findOneUnexpiredByEmailAndOrganization(
    email: string,
    organizationId: string,
  ): Promise<Invitation | null> {
    // Query the raw MongoDB collection to bypass Mongoose's String schema casting,
    // since Better Auth's MongoDB adapter stores reference fields as ObjectId
    const rawDoc = await this.invitationModel.collection.findOne({
      email: { $eq: email },
      organizationId: idFilter(organizationId),
      expiresAt: { $gte: new Date() },
      status: InvitationStatus.PENDING,
    });
    if (!rawDoc) return null;
    return InvitationMapper.toDomain(rawDoc);
  }

  async save(invitation: Invitation, headers?: BetterAuthHeaders): Promise<string> {
    return (
      await (this.auth.api as any).createInvitation({
        headers,
        body: {
          email: invitation.email,
          role: invitation.role,
          organizationId: invitation.organizationId,
        },
      })
    ).id;
  }
}
