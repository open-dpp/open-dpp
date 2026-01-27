import { Module } from "@nestjs/common";
import { EnvModule } from "@open-dpp/env";
import { EmailModule } from "../../email/email.module";
import { AuthService } from "./application/services/auth.service";
import { AUTH, AuthProvider } from "./auth.provider";
import { AuthController } from "./presentation/auth.controller";

@Module({
  imports: [
    EnvModule.forRoot(),
    EmailModule,
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    AuthProvider,
    AuthService,
  ],
  exports: [AuthService, AUTH, EnvModule],
})
export class AuthModule { }
