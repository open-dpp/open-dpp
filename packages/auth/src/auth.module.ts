import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { KeycloakAuthGuard } from './keycloak-auth/keycloak-auth.guard'

@Module({
  imports: [HttpModule],
  providers: [AuthService, KeycloakAuthGuard],
  exports: [AuthService, KeycloakAuthGuard],
})
export class AuthModule {}
