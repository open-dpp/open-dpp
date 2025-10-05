import { HttpModule } from "@nestjs/axios";
import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { KeycloakAuthGuard } from "./keycloak-auth/keycloak-auth.guard";

@Module({})
export class AuthModule {
  static forRoot(): DynamicModule {
    return {
      module: AuthModule,
      imports: [HttpModule, ConfigModule],
      providers: [AuthService, KeycloakAuthGuard],
      exports: [AuthService, KeycloakAuthGuard],
    };
  }
}
