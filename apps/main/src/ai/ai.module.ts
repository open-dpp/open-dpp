import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { EnvModule } from "@open-dpp/env";
import { UniqueProductIdentifierModule } from "../unique-product-identifier/unique.product.identifier.module";
import { AiConfigurationDbSchema, AiConfigurationDoc } from "./ai-configuration/infrastructure/ai-configuration.schema";
import { AiConfigurationService } from "./ai-configuration/infrastructure/ai-configuration.service";
import { AiConfigurationController } from "./ai-configuration/presentation/ai-configuration.controller";
import { ChatService } from "./chat.service";
import { AiService } from "./infrastructure/ai.service";
import { McpClientModule } from "./mcp-client/mcp-client.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AiConfigurationDoc.name,
        schema: AiConfigurationDbSchema,
      },
    ]),
    UniqueProductIdentifierModule,
    EnvModule,
    McpClientModule,
  ],
  controllers: [AiConfigurationController],
  providers: [
    ChatService,
    AiConfigurationService,
    AiService,
  ],
  exports: [AiService, ChatService],
})
export class AiModule {}
