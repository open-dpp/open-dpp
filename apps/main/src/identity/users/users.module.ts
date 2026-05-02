import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EmailModule } from "../../email/email.module";
import { AuthModule } from "../auth/auth.module";
import { EmailChangeRequestsModule } from "../email-change-requests/email-change-requests.module";
import { UsersService } from "./application/services/users.service";
import { UsersRepository } from "./infrastructure/adapters/users.repository";
import { UserMapper } from "./infrastructure/mappers/user.mapper";
import { User, UserSchema } from "./infrastructure/schemas/user.schema";
import { UsersController } from "./presentation/users.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => AuthModule),
    EmailChangeRequestsModule,
    EmailModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserMapper, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
