import { MemberRole, MemberRoleEnum, MemberRoleType } from "./member-role.enum";
import { Types } from "mongoose";

export interface MemberCreateProps {
  organizationId: string;
  userId: string;
  role: MemberRoleType;
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
  role: MemberRoleType;
  createdAt: Date;
  user: MemberUser | null;
}

export class Member {
  private constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly userId: string,
    private _role: MemberRoleType,
    public readonly createdAt: Date,
  ) {}

  get role(): MemberRoleType {
    return this._role;
  }

  public static create(data: MemberCreateProps) {
    const now = new Date();
    return new Member(
      new Types.ObjectId().toHexString(),
      data.organizationId,
      data.userId,
      data.role,
      now,
    );
  }

  public static loadFromDb(data: MemberDbProps) {
    const parsedRole = MemberRoleEnum.safeParse(data.role);
    const role = parsedRole.success ? parsedRole.data : MemberRole.MEMBER; // handle old records with outdated roles like 'admin'
    return new Member(data.id, data.organizationId, data.userId, role, data.createdAt);
  }

  public isOwner(): boolean {
    return this._role === MemberRole.OWNER;
  }

  changeRole(newRole: MemberRoleType) {
    this._role = newRole;
  }

  public toPlain(): {
    id: string;
    organizationId: string;
    userId: string;
    role: MemberRoleType;
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
