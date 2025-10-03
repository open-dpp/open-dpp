import { Module } from "@nestjs/common";
import { McpClientService } from "./mcp-client.service";

@Module({
  providers: [McpClientService],
  exports: [McpClientService],
})
export class McpClientModule {}
