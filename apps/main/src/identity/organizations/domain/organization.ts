import { randomUUID } from "node:crypto";
import { Member } from "./member";

export interface OrganizationCreateProps {
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: any;
}

export type OrganizationDbProps = OrganizationCreateProps & {
  id: string;
  createdAt: Date;
};

export interface OrganizationUpdateProps {
  name: string;
  logo?: string | null;
}

export class Organization {
  public readonly id: string;
  public readonly name: string;
  public readonly slug: string;
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
    return new Organization(
      randomUUID(),
      data.name,
      data.slug,
      data.logo ?? null,
      data.metadata ?? {},
      now,
      [],
    );
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

  isMember(member: Member) {
    return this.members.some(m => m.id === member.id);
  }

  addMember(member: Member) {
    if (this.isMember(member)) {
      return;
    }
    this.members.push(member);
  }
}
