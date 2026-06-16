import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { AccountsService } from "./application/services/accounts.service";
import { AccountsRepository } from "./infrastructure/adapters/accounts.repository";
import { Account, AccountSchema } from "./infrastructure/schemas/account.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    forwardRef(() => AuthModule),
  ],
  providers: [AccountsService, AccountsRepository],
  exports: [AccountsService],
})
export class AccountsModule {}
