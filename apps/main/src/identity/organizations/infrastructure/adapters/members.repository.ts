import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Member } from "../../domain/member";
import { MemberMapper } from "../mappers/member.mapper";
import { Member as MemberSchema } from "../schemas/member.schema";

@Injectable()
export class MembersRepository {
  constructor(
    @InjectModel(MemberSchema.name)
    private readonly memberModel: Model<MemberSchema>,
  ) { }

  private toObjectIdIfValid(id: string): Types.ObjectId | string {
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id;
  }

  async save(member: Member): Promise<void> {
    const persistenceModel = MemberMapper.toPersistence(member);
    await this.memberModel.findByIdAndUpdate(
      member.id,
      persistenceModel,
      { upsert: true },
    );
  }

  async findOneById(id: string): Promise<Member | null> {
    const document = await this.memberModel.findById(id);
    if (!document)
      return null;
    return MemberMapper.toDomain(document);
  }

  async findByOrganizationId(organizationId: string): Promise<Member[]> {
    // Better Auth stores organizationId as ObjectId
    const filter = {
      organizationId: this.toObjectIdIfValid(organizationId),
    };
    const documents = await this.memberModel.find(filter as any);
    return documents.map(doc => MemberMapper.toDomain(doc));
  }

  async findByUserId(userId: string): Promise<Member[]> {
    // Better Auth stores userId as ObjectId
    const filter = {
      userId: this.toObjectIdIfValid(userId),
    };
    const documents = await this.memberModel.find(filter as any);
    return documents.map(doc => MemberMapper.toDomain(doc));
  }

  async findOneByUserIdAndOrganizationId(userId: string, organizationId: string): Promise<Member | null> {
    // Better Auth stores userId and organizationId as ObjectIds, so we need to convert
    // the string query parameters to ObjectIds for the query to match
    const filter = {
      userId: this.toObjectIdIfValid(userId),
      organizationId: this.toObjectIdIfValid(organizationId),
    };

    const document = await this.memberModel.findOne(filter as any);

    if (!document)
      return null;
    return MemberMapper.toDomain(document);
  }
}
