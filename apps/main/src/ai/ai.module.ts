import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PermissionModule } from "@open-dpp/auth";
import { EnvModule } from "@open-dpp/env";
import { UniqueProductIdentifierModule } from "../unique-product-identifier/unique.product.identifier.module";
import { AiConfigurationDbSchema, AiConfigurationDoc } from "./ai-configuration/infrastructure/ai-configuration.schema";
import { AiConfigurationService } from "./ai-configuration/infrastructure/ai-configuration.service";
import { AiConfigurationController } from "./ai-configuration/presentation/ai-configuration.controller";
import { ChatService } from "./chat.service";
import { AiService } from "./infrastructure/ai.service";
import { McpClientService } from "./mcp-client/mcp-client.service";
import { PassportService } from "./passports/passport.service";
import { ChatGateway } from "./presentation/chat.gateway";

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
    PassportService,
  ],
  exports: [AiService, McpClientService],
})
export class AiModule {}
