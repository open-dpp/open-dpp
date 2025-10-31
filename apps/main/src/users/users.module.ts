import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { UsersService } from "./infrastructure/users.service";

@Module({
  imports: [
    forwardRef(() => OrganizationsModule),
    AuthModule,
  ],
  controllers: [],
  providers: [
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
