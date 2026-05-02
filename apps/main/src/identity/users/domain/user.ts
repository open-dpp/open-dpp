import { randomUUID } from "node:crypto";
import { Language, LanguageType } from "@open-dpp/dto";
import { UserRole, UserRoleType } from "./user-role.enum";

export interface UserCreateProps {
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  image?: string;
  emailVerified?: boolean;
  role?: UserRoleType;
  banned?: boolean;
  banReason?: string | null;
  banExpires?: Date | null;
  preferredLanguage?: LanguageType;
  pendingEmail?: string | null;
  pendingEmailRequestedAt?: Date | null;
}

export type UserDbProps = Omit<UserCreateProps, "firstName" | "lastName"> & {
  firstName: string | null;
  lastName: string | null;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  role: UserRoleType;
  preferredLanguage: LanguageType;
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
  public readonly role: UserRoleType;
  public readonly banned: boolean;
  public readonly banReason: string | null;
  public readonly banExpires: Date | null;
  public readonly preferredLanguage: LanguageType;
  public readonly pendingEmail: string | null;
  public readonly pendingEmailRequestedAt: Date | null;

  private constructor(
    id: string,
    email: string,
    firstName: string | null,
    lastName: string | null,
    image: string | null,
    emailVerified: boolean,
    createdAt: Date,
    updatedAt: Date,
    role: UserRoleType,
    banned: boolean,
    banReason: string | null,
    banExpires: Date | null,
    preferredLanguage: LanguageType,
    pendingEmail: string | null,
    pendingEmailRequestedAt: Date | null,
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
    this.preferredLanguage = preferredLanguage;
    this.pendingEmail = pendingEmail;
    this.pendingEmailRequestedAt = pendingEmailRequestedAt;
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
      data.preferredLanguage ?? Language.en,
      data.pendingEmail ?? null,
      data.pendingEmailRequestedAt ?? null,
    );
  }

  private copyWith(overrides: Partial<Omit<UserDbProps, "name">>): User {
    return new User(
      overrides.id ?? this.id,
      overrides.email ?? this.email,
      overrides.firstName !== undefined ? overrides.firstName : this.firstName,
      overrides.lastName !== undefined ? overrides.lastName : this.lastName,
      overrides.image !== undefined ? overrides.image : this.image,
      overrides.emailVerified ?? this.emailVerified,
      overrides.createdAt ?? this.createdAt,
      overrides.updatedAt ?? new Date(),
      overrides.role ?? this.role,
      overrides.banned ?? this.banned,
      overrides.banReason !== undefined ? overrides.banReason : this.banReason,
      overrides.banExpires !== undefined ? overrides.banExpires : this.banExpires,
      overrides.preferredLanguage ?? this.preferredLanguage,
      overrides.pendingEmail !== undefined ? overrides.pendingEmail : this.pendingEmail,
      overrides.pendingEmailRequestedAt !== undefined
        ? overrides.pendingEmailRequestedAt
        : this.pendingEmailRequestedAt,
    );
  }

  public withRole(role: UserRoleType): User {
    return this.copyWith({ role });
  }

  public withEmailVerified(emailVerified: boolean): User {
    return this.copyWith({ emailVerified });
  }

  public withName(firstName: string | null, lastName: string | null): User {
    if (firstName === this.firstName && lastName === this.lastName) {
      return this;
    }
    return this.copyWith({ firstName, lastName });
  }

  public withPreferredLanguage(preferredLanguage: LanguageType): User {
    if (preferredLanguage === this.preferredLanguage) {
      return this;
    }
    return this.copyWith({ preferredLanguage });
  }

  public withPendingEmail(pendingEmail: string, pendingEmailRequestedAt: Date): User {
    if (
      pendingEmail === this.pendingEmail &&
      pendingEmailRequestedAt.getTime() === this.pendingEmailRequestedAt?.getTime()
    ) {
      return this;
    }
    return this.copyWith({ pendingEmail, pendingEmailRequestedAt });
  }

  public withoutPendingEmail(): User {
    if (this.pendingEmail === null && this.pendingEmailRequestedAt === null) {
      return this;
    }
    return this.copyWith({ pendingEmail: null, pendingEmailRequestedAt: null });
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
      data.role ?? UserRole.USER, // handles old user records without role
      data.banned ?? false,
      data.banReason ?? null,
      data.banExpires ?? null,
      data.preferredLanguage ?? Language.en,
      data.pendingEmail ?? null,
      data.pendingEmailRequestedAt ?? null,
    );
  }
}
