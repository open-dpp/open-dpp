import { randomUUID } from "node:crypto";
import { UserRole } from "./user-role.enum";

export interface UserCreateProps {
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  image?: string;
  emailVerified?: boolean;
  role?: UserRole;
  banned?: boolean;
  banReason?: string | null;
  banExpires?: Date | null;
}

export type UserDbProps = Omit<UserCreateProps, "firstName" | "lastName"> & {
  firstName: string | null;
  lastName: string | null;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  role: UserRole;
};

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly firstName: string | null;
  public readonly lastName: string | null;
  public readonly name: string | null;
  public readonly image: string | null;
  public readonly emailVerified: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly role: UserRole;
  public readonly banned: boolean;
  public readonly banReason: string | null;
  public readonly banExpires: Date | null;

  private constructor(
    id: string,
    email: string,
    firstName: string | null,
    lastName: string | null,
    image: string | null,
    emailVerified: boolean,
    createdAt: Date,
    updatedAt: Date,
    role: UserRole,
    banned: boolean,
    banReason: string | null,
    banExpires: Date | null,
  ) {
    this.id = id;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
    this.name = fullName || null;
    this.image = image;
    this.emailVerified = emailVerified;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.role = role;
    this.banned = banned;
    this.banReason = banReason;
    this.banExpires = banExpires;
  }

  public static create(data: UserCreateProps) {
    const now = new Date();
    return new User(
      randomUUID(),
      data.email,
      data.firstName ?? null,
      data.lastName ?? null,
      data.image ?? null,
      data.emailVerified ?? false,
      now,
      now,
      data.role ?? UserRole.USER,
      !!data.banned,
      data.banReason ?? null,
      data.banExpires ?? null,
    );
  }

  public static loadFromDb(data: UserDbProps) {
    return new User(
      data.id,
      data.email,
      data.firstName ?? null,
      data.lastName ?? null,
      data.image ?? null,
      data.emailVerified ?? false,
      data.createdAt,
      data.updatedAt,
      data.role,
      data.banned ?? false,
      data.banReason ?? null,
      data.banExpires ?? null,
    );
  }
}
