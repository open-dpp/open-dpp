import { Module } from '@nestjs/common';
import { PassportTemplateController } from './presentation/passport-template.controller';
import { PassportTemplateService } from './infrastructure/passport-template.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PassportTemplateDoc,
  PassportTemplateDbSchema,
} from './infrastructure/passport-template.schema';
import { PermissionModule } from '@app/permission';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PassportTemplateDoc.name,
        schema: PassportTemplateDbSchema,
      },
    ]),
    PermissionModule,
  ],
  controllers: [PassportTemplateController],
  providers: [PassportTemplateService],
  exports: [PassportTemplateService],
})
export class PassportTemplateModule {}
