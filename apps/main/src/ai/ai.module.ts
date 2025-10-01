import { Module } from '@nestjs/common';
import { AiService } from './infrastructure/ai.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AiConfigurationDbSchema,
  AiConfigurationDoc,
} from './infrastructure/ai-configuration.schema';
import { McpClientService } from './infrastructure/mcp-client.service';
import { PermissionModule } from '@app/permission';
import { AiConfigurationController } from './presentation/ai-configuration.controller';
import { AiConfigurationService } from './infrastructure/ai-configuration.service';
import { ChatGateway } from './presentation/chat.gateway';
import { ChatService } from './infrastructure/chat.service';
import { UniqueProductIdentifierModule } from '../unique-product-identifier/unique.product.identifier.module';
import { EnvModule } from 'libs/env/src/env.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AiConfigurationDoc.name,
        schema: AiConfigurationDbSchema,
      },
    ]),
    UniqueProductIdentifierModule,
    PermissionModule,
    EnvModule,
  ],
  controllers: [AiConfigurationController],
  providers: [
    ChatGateway,
    ChatService,
    AiConfigurationService,
    AiService,
    McpClientService,
  ],
  exports: [AiService, McpClientService],
})
export class AiModule {}
