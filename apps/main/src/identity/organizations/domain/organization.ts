import { ObjectId } from "mongodb";
import { Invitation } from "./invitation";
import { Member } from "./member";
import { MemberRoleType } from "./member-role.enum";

export interface OrganizationCreateProps {
  name: string;
  logo?: string | null;
  metadata?: any;
}

export type OrganizationDbProps = OrganizationCreateProps & {
  id: string;
  /** Stored verbatim; equals `id` for every organization created or backfilled since #852. */
  slug: string;
  createdAt: Date;
};

export interface OrganizationUpdateProps {
  name: string;
  logo?: string | null;
}

export class Organization {
  public readonly id: string;
  public readonly name: string;
  /**
   * Internal better-auth alias of the organization. Always equal to `id` for new
   * organizations (set on create); never exposed by the API and never chosen by a caller.
   */
  public readonly slug: string;
  /**
   * @deprecated Use `Branding.logo` instead.
   */
  public readonly logo: string | null;
  public readonly metadata: any;
  public readonly createdAt: Date;
  public readonly members: Member[];

  private constructor(
    id: string,
    name: string,
    slug: string,
    logo: string | null,
    metadata: any,
    createdAt: Date,
    members: Member[],
  ) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.logo = logo;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.members = members;
  }

  public static create(data: OrganizationCreateProps) {
    const now = new Date();
    const id = new ObjectId().toHexString();
    return new Organization(id, data.name, id, data.logo ?? null, data.metadata ?? {}, now, []);
  }

  public static loadFromDb(data: OrganizationDbProps) {
    return new Organization(
      data.id,
      data.name,
      data.slug,
      data.logo ?? null,
      data.metadata ?? {},
      data.createdAt,
      [],
    );
  }

  public update(data: OrganizationUpdateProps): Organization {
    return new Organization(
      this.id,
      data.name,
      this.slug,
      data.logo ?? null,
      this.metadata,
      this.createdAt,
      this.members,
    );
  }

  isMember(member: Member) {
    return this.members.some((m) => m.id === member.id);
  }

  addMember(member: Member): Organization {
    if (this.isMember(member)) {
      return this;
    }
    return new Organization(
      this.id,
      this.name,
      this.slug,
      this.logo,
      this.metadata,
      this.createdAt,
      [...this.members, member],
    );
  }

  inviteMember(email: string, inviterId: string, role: MemberRoleType): Invitation {
    return Invitation.create({
      email,
      inviterId,
      organizationId: this.id,
      role,
    });
  }
}
