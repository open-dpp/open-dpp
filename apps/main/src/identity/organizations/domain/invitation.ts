import { randomUUID } from "node:crypto";
import { MemberRole } from "./member-role.enum";

export interface InvitationCreateProps {
  email: string;
  inviterId: string;
  organizationId: string;
  role: MemberRole;
}

export type InvitationDbProps = InvitationCreateProps & {
  id: string;
  createdAt: Date;
  expiresAt: Date;
};

export class Invitation {
  public readonly id: string;
  public readonly email: string;
  public readonly inviterId: string;
  public readonly organizationId: string;
  public readonly role: MemberRole;
  public readonly createdAt: Date;
  public readonly expiresAt: Date;

  private constructor(
    id: string,
    email: string,
    inviterId: string,
    organizationId: string,
    role: MemberRole,
    createdAt: Date,
    expiresAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.inviterId = inviterId;
    this.organizationId = organizationId;
    this.role = role;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
  }

  public static create(data: InvitationCreateProps) {
    const now = new Date();
    return new Invitation(
      randomUUID(),
      data.email,
      data.inviterId,
      data.organizationId,
      data.role,
      now,
      now,
    );
  }

  public static loadFromDb(data: InvitationDbProps) {
    return new Invitation(
      data.id,
      data.email,
      data.inviterId,
      data.organizationId,
      data.role,
      data.createdAt,
      data.expiresAt,
    );
  }
}
