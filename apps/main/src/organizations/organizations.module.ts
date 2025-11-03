import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    AuthModule,
    forwardRef(() => UsersModule),
    EmailModule,
  ],
})
export class OrganizationsModule {}
