import { Module } from "@nestjs/common";
import { EnvModule } from "@open-dpp/env";
import { EmailModule } from "../../email/email.module";
import { AuthController } from "./auth.controller";
import { AUTH, AuthProvider } from "./auth.provider";
import { AuthService } from "./auth.service";

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
