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

export interface MemberUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface MemberWithUser {
  id: string;
  organizationId: string;
  userId: string;
  role: MemberRole;
  createdAt: Date;
  user: MemberUser | null;
}

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

  public isOwner(): boolean {
    return this.role === MemberRole.OWNER;
  }

  public toPlain(): {
    id: string;
    organizationId: string;
    userId: string;
    role: MemberRole;
    createdAt: Date;
  } {
    return {
      id: this.id,
      organizationId: this.organizationId,
      userId: this.userId,
      role: this.role,
      createdAt: this.createdAt,
    };
  }
}
