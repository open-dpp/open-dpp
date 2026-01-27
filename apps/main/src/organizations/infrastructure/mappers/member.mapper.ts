import { Member, MemberDbProps } from "../../domain/member";
import { MemberDocument, Member as MemberSchema } from "../schemas/member.schema";

export class MemberMapper {
  static toDomain(document: MemberDocument): Member {
    const props: MemberDbProps = {
      id: document.id,
      organizationId: document.organizationId,
      userId: document.userId,
      role: document.role,
      createdAt: document.createdAt,
    };
    return Member.loadFromDb(props);
  }

  static toPersistence(entity: Member): MemberSchema {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      userId: entity.userId,
      role: entity.role,
      createdAt: entity.createdAt,
    } as MemberSchema;
  }
}
