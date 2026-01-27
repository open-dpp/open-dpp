import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Member } from "../../domain/member";
import { MembersRepositoryPort } from "../../domain/ports/members.repository.port";
import { MemberMapper } from "../mappers/member.mapper";
import { Member as MemberSchema } from "../schemas/member.schema";

@Injectable()
export class MembersRepository implements MembersRepositoryPort {
  constructor(
    @InjectModel(MemberSchema.name)
    private readonly memberModel: Model<MemberSchema>,
  ) { }

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
    const documents = await this.memberModel.find({ organizationId });
    return documents.map(MemberMapper.toDomain);
  }

  async findByUserId(userId: string): Promise<Member[]> {
    const documents = await this.memberModel.find({ userId });
    return documents.map(MemberMapper.toDomain);
  }

  async findOneByUserIdAndOrganizationId(userId: string, organizationId: string): Promise<Member | null> {
    const document = await this.memberModel.findOne({ userId, organizationId });
    if (!document)
      return null;
    return MemberMapper.toDomain(document);
  }
}
