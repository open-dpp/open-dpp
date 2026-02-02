import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { UsersRepository } from "./infrastructure/adapters/users.repository";
import { UserMapper } from "./infrastructure/mappers/user.mapper";
import { User, UserSchema } from "./infrastructure/schemas/user.schema";
import { UsersService } from "./infrastructure/users.service";
import { UsersController } from "./presentation/users.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => OrganizationsModule),
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserMapper,
    UsersRepository,
  ],
  exports: [UsersService, UsersRepository],
})
export class UsersModule { }
