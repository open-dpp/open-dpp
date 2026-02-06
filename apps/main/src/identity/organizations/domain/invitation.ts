import { randomUUID } from "node:crypto";
import { InvitationStatus } from "./invitation-status.enum";
import { MemberRole } from "./member-role.enum";

export interface InvitationCreateProps {
  email: string;
  inviterId: string;
  organizationId: string;
  role: MemberRole;
  status?: InvitationStatus;
  ttl?: number;
}

export type InvitationDbProps = InvitationCreateProps & {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  status: InvitationStatus;
};

export class Invitation {
  public readonly id: string;
  public readonly email: string;
  public readonly inviterId: string;
  public readonly organizationId: string;
  public readonly role: MemberRole;
  public readonly status: InvitationStatus;
  public readonly createdAt: Date;
  public readonly expiresAt: Date;

  private constructor(
    id: string,
    email: string,
    inviterId: string,
    organizationId: string,
    role: MemberRole,
    status: InvitationStatus,
    createdAt: Date,
    expiresAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.inviterId = inviterId;
    this.organizationId = organizationId;
    this.role = role;
    this.status = status;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
  }

  private static readonly DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  public static create(data: InvitationCreateProps) {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + (data.ttl ?? Invitation.DEFAULT_TTL),
    );
    return new Invitation(
      randomUUID(),
      data.email,
      data.inviterId,
      data.organizationId,
      data.role,
      data.status || InvitationStatus.PENDING,
      now,
      expiresAt,
    );
  }

  public static loadFromDb(data: InvitationDbProps) {
    return new Invitation(
      data.id,
      data.email,
      data.inviterId,
      data.organizationId,
      data.role,
      data.status,
      data.createdAt,
      data.expiresAt,
    );
  }
}
