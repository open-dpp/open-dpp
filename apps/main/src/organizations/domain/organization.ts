import type { User } from "../../users/domain/user";
import { randomUUID } from "node:crypto";
import { OrganizationSubject } from "@open-dpp/permission";
import { Expose } from "class-transformer";

export interface OrganizationCreateProps {
  name: string;
  createdByUserId: string;
  ownedByUserId: string;
  members: User[];
}

export interface OrganizationDbProps {
  id: string;
  name: string;
  createdByUserId: string;
  ownedByUserId: string;
  members: User[];
}

export class Organization {
  @Expose()
  readonly id: string = randomUUID();

  @Expose()
  readonly name: string = "";

  @Expose()
  readonly members: User[] = [];

  @Expose()
  readonly createdByUserId: string = "";

  @Expose()
  readonly ownedByUserId: string = "";

  private constructor(
    id: string,
    name: string,
    createdByUserId: string,
    ownedByUserId: string,
    members: User[],
  ) {
    this.id = id;
    this.name = name;
    this.createdByUserId = createdByUserId;
    this.ownedByUserId = ownedByUserId;
    this.members = members;
  }

  public static create(data: OrganizationCreateProps) {
    return new Organization(
      randomUUID(),
      data.name,
      data.createdByUserId,
      data.ownedByUserId,
      data.members,
    );
  }

  public static loadFromDb(data: OrganizationDbProps) {
    return new Organization(
      data.id,
      data.name,
      data.createdByUserId,
      data.ownedByUserId,
      data.members,
    );
  }

  join(user: User) {
    if (!this.members.find(m => m.id === user.id)) {
      this.members.push(user);
    }
  }

  isMember(user: User) {
    return this.members.some(m => m.id === user.id);
  }

  toPermissionSubject() {
    return new OrganizationSubject(
      this.id,
      this.ownedByUserId,
      this.members.map(member => member.id),
    );
  }
}
