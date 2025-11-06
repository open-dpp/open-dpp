import { Module } from "@nestjs/common";
import { EnvModule } from "@open-dpp/env";
import { EmailModule } from "../email/email.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { KeycloakSyncOnStartupService } from "./keycloak-sync-on-startup.service";

@Module({
  imports: [
    EnvModule.forRoot(),
    EmailModule,
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    AuthService,
    KeycloakSyncOnStartupService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
