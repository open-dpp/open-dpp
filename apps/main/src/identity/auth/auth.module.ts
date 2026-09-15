import { forwardRef, Module } from "@nestjs/common";
import { EnvModule } from "@open-dpp/env";
import { EmailModule } from "../../email/email.module";
import { InstanceSettingsModule } from "../../instance-settings/instance-settings.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { SessionsService } from "./application/services/sessions.service";
import { EmailVerificationLinkBuilder } from "./infrastructure/adapters/email-verification-link.builder";
import { PasswordResetTokensRepository } from "./infrastructure/adapters/password-reset-tokens.repository";
import { SessionsRepository } from "./infrastructure/adapters/sessions.repository";
import { AUTH, AuthProvider } from "./auth.provider";
import { AuthController } from "./presentation/auth.controller";

@Module({
  imports: [
    EnvModule.forRoot(),
    EmailModule,
    InstanceSettingsModule,
    forwardRef(() => OrganizationsModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthProvider,
    SessionsService,
    SessionsRepository,
    PasswordResetTokensRepository,
    EmailVerificationLinkBuilder,
  ],
  exports: [
    SessionsService,
    SessionsRepository,
    PasswordResetTokensRepository,
    EmailVerificationLinkBuilder,
    AUTH,
    EnvModule,
  ],
})
export class AuthModule {}
