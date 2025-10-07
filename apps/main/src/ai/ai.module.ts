import { Module } from "@nestjs/common";
import { AiService } from "./ai.service";

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
