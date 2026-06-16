import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Account } from "../../domain/account";
import { AccountMapper } from "../mappers/account.mapper";
import { AccountDocument, Account as AccountSchemaClass } from "../schemas/account.schema";

// better-auth's providerId for the email+password credential account.
const CREDENTIAL_PROVIDER_ID = "credential";

/**
 * Read-only access to better-auth's `account` collection (see ADR-0002). better-auth is the sole
 * writer; this repository intentionally exposes no `save`/`update`/`delete` — writing accounts
 * here would bypass better-auth's credential invariants.
 */
@Injectable()
export class AccountsRepository {
  constructor(
    @InjectModel(AccountSchemaClass.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  // Better Auth stores userId as ObjectId, so a string query value must be coerced or it never
  // matches. Mirrors MembersRepository's handling of the same better-auth reference type.
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
