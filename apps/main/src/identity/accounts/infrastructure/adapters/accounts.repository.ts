import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { idFilter } from "../../../lib/better-auth-id";
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

  async findCredentialByUserId(userId: string): Promise<Account | null> {
    const filter = {
      userId: idFilter(userId),
      providerId: { $eq: CREDENTIAL_PROVIDER_ID },
    };
    const document = await this.accountModel.findOne(filter as any);
    if (!document) {
      return null;
    }
    return AccountMapper.toDomain(document);
  }
}
