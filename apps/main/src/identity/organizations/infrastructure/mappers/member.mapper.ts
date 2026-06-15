import { Types } from "mongoose";
import { Member, MemberDbProps } from "../../domain/member";
import { MemberDocument, Member as MemberSchema } from "../schemas/member.schema";
import { ObjectId } from "mongodb";

export class MemberMapper {
  static toDomain(document: MemberDocument): Member {
    const props: MemberDbProps = {
      id: document._id.toString(),
      // Convert ObjectId to string for domain layer
      organizationId: document.organizationId.toString(),
      userId: document.userId.toString(),
      role: document.role,
      createdAt: document.createdAt,
    };
    return Member.loadFromDb(props);
  }

  static toPersistence(entity: Member): MemberSchema {
    const userId = Types.ObjectId.isValid(entity.userId)
      ? new Types.ObjectId(entity.userId)
      : entity.userId;

    return {
      _id: new ObjectId(entity.id),
      // Convert string IDs to ObjectId for storage
      organizationId: new Types.ObjectId(entity.organizationId),
      userId,
      role: entity.role,
      createdAt: entity.createdAt,
    };
  }
}
