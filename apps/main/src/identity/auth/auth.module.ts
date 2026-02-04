import { forwardRef, Module } from "@nestjs/common";
import { EnvModule } from "@open-dpp/env";
import { EmailModule } from "../../email/email.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { SessionsService } from "./application/services/sessions.service";
import { AUTH, AuthProvider } from "./auth.provider";
import { AuthController } from "./presentation/auth.controller";

@Module({
  imports: [
    EnvModule.forRoot(),
    EmailModule,
    forwardRef(() => OrganizationsModule),
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    AuthProvider,
    SessionsService,
  ],
  exports: [SessionsService, AUTH, EnvModule],
})
export class AuthModule { }
