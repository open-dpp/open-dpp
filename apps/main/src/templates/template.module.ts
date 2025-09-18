import { Module } from '@nestjs/common';
import { TemplateController } from './presentation/template.controller';
import { TemplateService } from './infrastructure/template.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplateDoc, TemplateSchema } from './infrastructure/template.schema';
import { KeycloakResourcesModule } from '../keycloak-resources/keycloak-resources.module';
import { PermissionModule } from '@app/permission';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TemplateDoc.name,
        schema: TemplateSchema,
      },
    ]),
    KeycloakResourcesModule,
    PermissionModule,
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
