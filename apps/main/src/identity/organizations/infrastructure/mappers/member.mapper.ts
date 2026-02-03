import { Types } from "mongoose";
import { Member, MemberDbProps } from "../../domain/member";
import { MemberDocument, Member as MemberSchema } from "../schemas/member.schema";

export class MemberMapper {
  static toDomain(document: MemberDocument): Member {
    const props: MemberDbProps = {
      id: document._id,
      // Convert ObjectId to string for domain layer
      organizationId: document.organizationId.toString(),
      userId: document.userId.toString(),
      role: document.role,
      createdAt: document.createdAt,
    };
    return Member.loadFromDb(props);
  }

  static toPersistence(entity: Member): MemberSchema {
    return {
      _id: entity.id,
      // Convert string IDs to ObjectId for storage
      organizationId: new Types.ObjectId(entity.organizationId),
      userId: new Types.ObjectId(entity.userId),
      role: entity.role,
      createdAt: entity.createdAt,
    } as unknown as MemberSchema;
  }
}
