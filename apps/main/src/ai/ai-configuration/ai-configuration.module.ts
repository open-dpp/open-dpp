import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PermissionModule } from '@open-dpp/auth'
import {
  AiConfigurationDbSchema,
  AiConfigurationDoc,
} from './infrastructure/ai-configuration.schema'
import { AiConfigurationService } from './infrastructure/ai-configuration.service'
import { AiConfigurationController } from './presentation/ai-configuration.controller'

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
