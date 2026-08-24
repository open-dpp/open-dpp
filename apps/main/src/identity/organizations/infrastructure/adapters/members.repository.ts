import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Member } from "../../domain/member";
import { MemberMapper } from "../mappers/member.mapper";
import { Member as MemberSchema } from "../schemas/member.schema";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { ObjectId } from "mongodb";
import { idFilter } from "../../../lib/better-auth-id";

@Injectable()
export class MembersRepository {
  constructor(
    @InjectModel(MemberSchema.name)
    private readonly memberModel: Model<MemberSchema>,
  ) {}

  async save(member: Member): Promise<Member> {
    const persistenceModel = MemberMapper.toPersistence(member);
    const document = await this.memberModel.findByIdAndUpdate(member.id, persistenceModel, {
      upsert: true,
      new: true,
    });
    return MemberMapper.toDomain(document);
  }

  async findOneByIdOrFail(id: string): Promise<Member> {
    const member = await this.findOneById(id);
    if (!member) {
      throw new NotFoundInDatabaseException(Member.name);
    }
    return member;
  }

  async findOneById(id: string): Promise<Member | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    const document = await this.memberModel.findOne({ _id: new ObjectId(id) });
    if (!document) return null;
    return MemberMapper.toDomain(document);
  }

  async findByOrganizationId(organizationId: string): Promise<Member[]> {
    // The schema types organizationId as ObjectId, so a non-ObjectId id can never
    // match — return early instead of letting Mongoose throw a CastError.
    if (!Types.ObjectId.isValid(organizationId)) {
      return [];
    }
    // Better Auth stores organizationId as ObjectId
    const filter = {
      organizationId: { $eq: new Types.ObjectId(organizationId) },
    };
    const documents = await this.memberModel.find(filter as any);
    return documents.map((doc) => MemberMapper.toDomain(doc));
  }

  async findByUserId(userId: string): Promise<Member[]> {
    const filter = {
      userId: idFilter(userId),
    };
    const documents = await this.memberModel.find(filter as any);
    return documents.map((doc) => MemberMapper.toDomain(doc));
  }

  async findOneByUserIdAndOrganizationId(
    userId: string,
    organizationId: string,
  ): Promise<Member | null> {
    // The schema types organizationId as ObjectId, so a non-ObjectId id can never
    // match — return early instead of letting Mongoose throw a CastError.
    if (!Types.ObjectId.isValid(organizationId)) {
      return null;
    }
    const filter = {
      userId: idFilter(userId),
      organizationId: { $eq: new Types.ObjectId(organizationId) },
    };

    const document = await this.memberModel.findOne(filter as any);

    if (!document) return null;
    return MemberMapper.toDomain(document);
  }
}
