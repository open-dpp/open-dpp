import { Language, LanguageEnum, LanguageType, UserDto } from "@open-dpp/dto";
import { Logger } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { User, UserDbProps } from "../../domain/user";
import { UserDocument, User as UserSchema } from "../schemas/user.schema";

export class UserMapper {
  private static readonly logger = new Logger(UserMapper.name);

  static toDto(entity: User): UserDto {
    return {
      id: entity.id,
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      name: entity.name,
      image: entity.image,
      emailVerified: entity.emailVerified,
      preferredLanguage: entity.preferredLanguage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toDomain(document: UserDocument): User {
    const props: UserDbProps = {
      id: document._id.toString(),
      email: document.email,
      firstName: document.firstName,
      lastName: document.lastName,
      name: document.name,
      image: document.image,
      emailVerified: document.emailVerified,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      role: document.role,
      banned: document.banned,
      banReason: document.banReason,
      banExpires: document.banExpires,
      preferredLanguage: UserMapper.parsePreferredLanguage(
        document.preferredLanguage,
        document._id.toString(),
      ),
      pendingEmail: document.pendingEmail ?? null,
      pendingEmailRequestedAt: document.pendingEmailRequestedAt ?? null,
    };
    return User.loadFromDb(props);
  }

  static toPersistence(entity: User): UserSchema {
    return {
      _id: new ObjectId(entity.id),
      email: entity.email,
      firstName: entity.firstName ?? undefined,
      lastName: entity.lastName ?? undefined,
      name: entity.name ?? undefined,
      image: entity.image ?? undefined,
      emailVerified: entity.emailVerified,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      role: entity.role,
      banned: entity.banned,
      banReason: entity.banReason ?? null,
      banExpires: entity.banExpires ?? null,
      preferredLanguage: entity.preferredLanguage,
      pendingEmail: entity.pendingEmail ?? null,
      pendingEmailRequestedAt: entity.pendingEmailRequestedAt ?? null,
    } as UserSchema;
  }

  private static parsePreferredLanguage(value: unknown, userId?: string): LanguageType {
    const parsed = LanguageEnum.safeParse(value);
    if (parsed.success) {
      return parsed.data;
    }
    if (value !== undefined && value !== null) {
      UserMapper.logger.warn(
        `Unsupported preferredLanguage "${String(value)}" for user ${userId ?? "(unknown)"}; falling back to ${Language.en}`,
      );
    }
    return Language.en;
  }
}
