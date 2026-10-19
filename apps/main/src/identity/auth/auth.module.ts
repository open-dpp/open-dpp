import { forwardRef, Module } from "@nestjs/common";
import { EnvModule } from "@open-dpp/env";
import { EmailModule } from "../../email/email.module";
import { InstanceSettingsModule } from "../../instance-settings/instance-settings.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { OAuthProviderService } from "./application/services/oauth-provider.service";
import { SessionsService } from "./application/services/sessions.service";
import { SessionsRepository } from "./infrastructure/adapters/sessions.repository";
import { AUTH, AuthProvider } from "./auth.provider";
import { AuthController } from "./presentation/auth.controller";
import { OAuthProviderController } from "./presentation/oauth-provider.controller";

@Module({
  imports: [
    EnvModule.forRoot(),
    EmailModule,
    InstanceSettingsModule,
    forwardRef(() => OrganizationsModule),
  ],
  controllers: [AuthController, OAuthProviderController],
  providers: [AuthProvider, SessionsService, SessionsRepository, OAuthProviderService],
  exports: [SessionsService, SessionsRepository, AUTH, EnvModule],
})
export class AuthModule {}
