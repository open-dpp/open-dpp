import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PermissionModule } from '@open-dpp/auth'
import { KeycloakResourcesModule } from '../keycloak-resources/keycloak-resources.module'
import { UsersModule } from '../users/users.module'
import { OrganizationEntity } from './infrastructure/organization.entity'
import { OrganizationsService } from './infrastructure/organizations.service'
import { OrganizationsController } from './presentation/organizations.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationEntity]),
    KeycloakResourcesModule,
    forwardRef(() => UsersModule),
    PermissionModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
