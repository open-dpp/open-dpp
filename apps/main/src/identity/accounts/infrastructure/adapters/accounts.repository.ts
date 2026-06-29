import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Account } from "../../domain/account";
import { AccountMapper } from "../mappers/account.mapper";
import { AccountDocument, Account as AccountSchemaClass } from "../schemas/account.schema";

const CREDENTIAL_PROVIDER_ID = "credential";

@Injectable()
export class AccountsRepository {
  constructor(
    @InjectModel(AccountSchemaClass.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  private toObjectIdIfValid(id: string): Types.ObjectId | string {
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id;
  }

  async findCredentialByUserId(userId: string): Promise<Account | null> {
    const filter = {
      userId: { $eq: this.toObjectIdIfValid(userId) },
      providerId: { $eq: CREDENTIAL_PROVIDER_ID },
    };
    const document = await this.accountModel.findOne(filter as any);
    if (!document) {
      return null;
    }
    return AccountMapper.toDomain(document);
  }
}
