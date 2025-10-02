import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { TypeOrmModule } from '@nestjs/typeorm'
import { KeycloakResourcesModule } from '../keycloak-resources/keycloak-resources.module'
import { OrganizationEntity } from '../organizations/infrastructure/organization.entity'
import { OrganizationsService } from '../organizations/infrastructure/organizations.service'
import {
  TemplateDoc,
  TemplateSchema,
} from '../templates/infrastructure/template.schema'
import { TemplateService } from '../templates/infrastructure/template.service'
import { UserEntity } from '../users/infrastructure/user.entity'
import { UsersService } from '../users/infrastructure/users.service'
import { MarketplaceService } from './marketplace.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationEntity, UserEntity]),
    MongooseModule.forFeature([
      {
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    KeycloakResourcesModule,
  ],
  controllers: [],
  providers: [
    MarketplaceService,
    OrganizationsService,
    UsersService,
    TemplateService,
  ],

  exports: [MarketplaceService],
})
export class MarketplaceModule {}
