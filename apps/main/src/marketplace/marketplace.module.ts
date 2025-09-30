import { Module } from '@nestjs/common';
import { KeycloakResourcesModule } from '../keycloak-resources/keycloak-resources.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationEntity } from '../organizations/infrastructure/organization.entity';
import { UserEntity } from '../users/infrastructure/user.entity';
import { MarketplaceService } from './marketplace.service';
import { OrganizationsService } from '../organizations/infrastructure/organizations.service';
import { UsersService } from '../users/infrastructure/users.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TemplateDoc,
  TemplateSchema,
} from '../templates/infrastructure/template.schema';
import { TemplateService } from '../templates/infrastructure/template.service';
import {
  PassportTemplateDbSchema,
  PassportTemplateDoc,
} from './passport-templates/infrastructure/passport-template.schema';
import { PassportTemplateService } from './passport-templates/infrastructure/passport-template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrganizationEntity, UserEntity]),
    MongooseModule.forFeature([
      {
        name: PassportTemplateDoc.name,
        schema: PassportTemplateDbSchema,
      },
      {
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    KeycloakResourcesModule,
  ],
  controllers: [],
  providers: [
    PassportTemplateService,
    MarketplaceService,
    OrganizationsService,
    UsersService,
    TemplateService,
  ],

  exports: [MarketplaceService],
})
export class MarketplaceModule {}
