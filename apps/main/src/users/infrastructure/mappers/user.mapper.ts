import { User, UserDbProps } from "../../domain/user";
import { User as UserSchema, UserDocument } from "../schemas/user.schema";

export class UserMapper {
    static toDomain(document: UserDocument): User {
        const props: UserDbProps = {
            id: document._id,
            email: document.email,
            name: document.name,
            image: document.image,
            emailVerified: document.emailVerified,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
        };
        return User.loadFromDb(props);
    }

    static toPersistence(entity: User): UserSchema {
        return {
            _id: entity.id,
            email: entity.email,
            name: entity.name ?? undefined,
            image: entity.image ?? undefined,
            emailVerified: entity.emailVerified,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        } as UserSchema;
    }
}
