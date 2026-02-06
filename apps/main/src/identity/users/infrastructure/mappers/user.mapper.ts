import { User, UserDbProps } from "../../domain/user";
import { UserDocument, User as UserSchema } from "../schemas/user.schema";

export class UserMapper {
  static toDomain(document: UserDocument): User {
    const props: UserDbProps = {
      id: document._id,
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
    };
    return User.loadFromDb(props);
  }

  static toPersistence(entity: User): UserSchema {
    return {
      _id: entity.id,
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
      banReason: entity.banReason ?? undefined,
      banExpires: entity.banExpires ?? undefined,
    } as UserSchema;
  }
}
