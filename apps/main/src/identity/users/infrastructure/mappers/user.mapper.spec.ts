import { expect } from "@jest/globals";
import { User } from "../../domain/user";
import { UserRole } from "../../domain/user-role.enum";
import { UserDocument } from "../schemas/user.schema";
import { UserMapper } from "./user.mapper";

describe("userMapper", () => {
  const now = new Date();

  const validDomainUser = User.loadFromDb({
    id: "user-123",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    image: "image.png",
    emailVerified: true,
    role: UserRole.USER,
    createdAt: now,
    updatedAt: now,
    banned: true,
    banReason: "Violation of terms",
    banExpires: now,
  });

  const validUserDocument = {
    _id: "user-123",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    image: "image.png",
    emailVerified: true,
    role: UserRole.USER,
    createdAt: now,
    updatedAt: now,
    banned: true,
    banReason: "Violation of terms",
    banExpires: now,
  } as unknown as UserDocument;

  it("should map from domain to persistence", () => {
    const persistence = UserMapper.toPersistence(validDomainUser);

    expect(persistence).toEqual({
      _id: validDomainUser.id,
      email: validDomainUser.email,
      firstName: validDomainUser.firstName,
      lastName: validDomainUser.lastName,
      name: validDomainUser.name,
      image: validDomainUser.image,
      emailVerified: validDomainUser.emailVerified,
      role: validDomainUser.role,
      createdAt: validDomainUser.createdAt,
      updatedAt: validDomainUser.updatedAt,
      banned: validDomainUser.banned,
      banReason: validDomainUser.banReason,
      banExpires: validDomainUser.banExpires,
    });
  });

  it("should map from persistence to domain", () => {
    const domain = UserMapper.toDomain(validUserDocument);

    expect(domain).toBeInstanceOf(User);
    expect(domain.id).toBe(validUserDocument._id);
    expect(domain.email).toBe(validUserDocument.email);
    expect(domain.firstName).toBe(validUserDocument.firstName);
    expect(domain.banned).toBe(validUserDocument.banned);
    expect(domain.banReason).toBe(validUserDocument.banReason);
    expect(domain.banExpires).toBe(validUserDocument.banExpires);
  });
});
