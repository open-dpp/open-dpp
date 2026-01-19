import { Member, MemberDbProps } from "../../domain/member";
import { Member as MemberSchema, MemberDocument } from "../schemas/member.schema";

export class MemberMapper {
    static toDomain(document: MemberDocument): Member {
        const props: MemberDbProps = {
            id: document._id,
            organizationId: document.organizationId,
            userId: document.userId,
            role: document.role,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
        };
        return Member.loadFromDb(props);
    }

    static toPersistence(entity: Member): MemberSchema {
        return {
            _id: entity.id,
            organizationId: entity.organizationId,
            userId: entity.userId,
            role: entity.role,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        } as MemberSchema;
    }
}
