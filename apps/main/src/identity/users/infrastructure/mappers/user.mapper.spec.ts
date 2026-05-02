import { afterEach, beforeEach, expect, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import { Language } from "@open-dpp/dto";
import { ObjectId } from "mongodb";
import { User } from "../../domain/user";
import { UserRole } from "../../domain/user-role.enum";
import { UserDocument } from "../schemas/user.schema";
import { UserMapper } from "./user.mapper";

describe("userMapper", () => {
  const now = new Date();

  const userObjectId = new ObjectId();
  const validDomainUser = User.loadFromDb({
    id: userObjectId.toString(),
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
    preferredLanguage: Language.de,
  });

  const validUserDocument = {
    _id: userObjectId,
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
    preferredLanguage: "de",
  } as unknown as UserDocument;

  it("should map from domain to persistence", () => {
    const persistence = UserMapper.toPersistence(validDomainUser);

    expect(persistence).toEqual({
      _id: new ObjectId(validDomainUser.id),
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
      preferredLanguage: validDomainUser.preferredLanguage,
    });
  });

  it("should map from persistence to domain", () => {
    const domain = UserMapper.toDomain(validUserDocument);

    expect(domain).toBeInstanceOf(User);
    expect(domain.id).toBe(validUserDocument._id.toString());
    expect(domain.email).toBe(validUserDocument.email);
    expect(domain.firstName).toBe(validUserDocument.firstName);
    expect(domain.banned).toBe(validUserDocument.banned);
    expect(domain.banReason).toBe(validUserDocument.banReason);
    expect(domain.banExpires).toBe(validUserDocument.banExpires);
  });

  it("should map from persistence to domain and default to UserRole.USER", () => {
    const domain = UserMapper.toDomain({ ...validUserDocument, role: undefined } as any);

    expect(domain).toBeInstanceOf(User);
    expect(domain.role).toEqual(UserRole.USER);
  });

  it("maps preferredLanguage from persistence to domain", () => {
    const domain = UserMapper.toDomain(validUserDocument);
    expect(domain.preferredLanguage).toBe(Language.de);
  });

  it("defaults missing preferredLanguage in persistence to 'en'", () => {
    const domain = UserMapper.toDomain({
      ...validUserDocument,
      preferredLanguage: undefined,
    } as any);
    expect(domain.preferredLanguage).toBe(Language.en);
  });

  describe("toDto", () => {
    it("maps a domain User to a UserDto, stripping admin-only fields", () => {
      const dto = UserMapper.toDto(validDomainUser);

      expect(dto).toEqual({
        id: validDomainUser.id,
        email: validDomainUser.email,
        firstName: validDomainUser.firstName,
        lastName: validDomainUser.lastName,
        name: validDomainUser.name,
        image: validDomainUser.image,
        emailVerified: validDomainUser.emailVerified,
        preferredLanguage: validDomainUser.preferredLanguage,
        createdAt: validDomainUser.createdAt,
        updatedAt: validDomainUser.updatedAt,
      });
      expect(dto).not.toHaveProperty("role");
      expect(dto).not.toHaveProperty("banned");
      expect(dto).not.toHaveProperty("banReason");
      expect(dto).not.toHaveProperty("banExpires");
    });

    it("preserves null firstName/lastName/name without coercing to undefined", () => {
      const userWithoutNames = User.loadFromDb({
        id: new ObjectId().toString(),
        email: "anon@example.com",
        firstName: null,
        lastName: null,
        emailVerified: false,
        role: UserRole.USER,
        createdAt: now,
        updatedAt: now,
        banned: false,
        banReason: null,
        banExpires: null,
        preferredLanguage: Language.en,
      });

      const dto = UserMapper.toDto(userWithoutNames);

      expect(dto.firstName).toBeNull();
      expect(dto.lastName).toBeNull();
      expect(dto.name).toBeNull();
    });
  });

  describe("preferredLanguage fallback logging", () => {
    let warnSpy: jest.SpiedFunction<(message: any) => void>;

    beforeEach(() => {
      warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it("falls back to 'en' and warns when an unsupported value is persisted", () => {
      const domain = UserMapper.toDomain({
        ...validUserDocument,
        preferredLanguage: "fr",
      } as any);

      expect(domain.preferredLanguage).toBe(Language.en);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0]![0] as string;
      expect(message).toContain("fr");
      expect(message).toContain(validUserDocument._id.toString());
    });

    it("does NOT warn when preferredLanguage is undefined (legitimately missing)", () => {
      UserMapper.toDomain({
        ...validUserDocument,
        preferredLanguage: undefined,
      } as any);

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("does NOT warn when preferredLanguage is null (legitimately missing)", () => {
      UserMapper.toDomain({
        ...validUserDocument,
        preferredLanguage: null,
      } as any);

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

});
