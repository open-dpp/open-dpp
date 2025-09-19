import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AiConfigurationDbSchema,
  AiConfigurationDoc,
} from './infrastructure/ai-configuration.schema';
import { AiConfigurationController } from './presentation/ai-configuration.controller';
import { AiConfigurationService } from './infrastructure/ai-configuration.service';
import { PermissionModule } from '@app/permission';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AiConfigurationDoc.name,
        schema: AiConfigurationDbSchema,
      },
    ]),
    PermissionModule,
  ],
  controllers: [AiConfigurationController],
  providers: [AiConfigurationService],
  exports: [AiConfigurationService],
})
export class AiConfigurationModule {}
