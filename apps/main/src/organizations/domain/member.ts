import { randomBytes } from "node:crypto";

import { OrganizationRole } from "./organization-role.enum";

export interface MemberCreateProps {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
}

export type MemberDbProps = MemberCreateProps & {
  id: string;
  createdAt: Date;
};

function generate24CharId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = randomBytes(8).toString("hex");
  return timestamp + random;
}

export class Member {
  public readonly id: string;
  public readonly organizationId: string;
  public readonly userId: string;
  public readonly role: OrganizationRole;
  public readonly createdAt: Date;

  private constructor(
    id: string,
    organizationId: string,
    userId: string,
    role: OrganizationRole,
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
      generate24CharId(),
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
