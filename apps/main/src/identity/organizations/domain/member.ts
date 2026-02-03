import { randomUUID } from "node:crypto";
import { MemberRole } from "./member-role.enum";

export interface MemberCreateProps {
  organizationId: string;
  userId: string;
  role: MemberRole;
}

export type MemberDbProps = MemberCreateProps & {
  id: string;
  createdAt: Date;
};

export class Member {
  public readonly id: string;
  public readonly organizationId: string;
  public readonly userId: string;
  public readonly role: MemberRole;
  public readonly createdAt: Date;

  private constructor(
    id: string,
    organizationId: string,
    userId: string,
    role: MemberRole,
    createdAt: Date,
  ) {
    this.id = id;
    this.organizationId = organizationId;
    this.userId = userId;
    this.role = role;
    this.createdAt = createdAt;
  }

  public static create(data: MemberCreateProps) {
    const now = new Date();
    return new Member(
      randomUUID(),
      data.organizationId,
      data.userId,
      data.role,
      now,
    );
  }

  public static loadFromDb(data: MemberDbProps) {
    return new Member(
      data.id,
      data.organizationId,
      data.userId,
      data.role,
      data.createdAt,
    );
  }
}
