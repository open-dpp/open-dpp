import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";

@Injectable()
export class McpClientService implements OnModuleDestroy {
  private readonly logger = new Logger(McpClientService.name);
  private client: MultiServerMCPClient;
  private readonly configService: EnvService;

  constructor(configService: EnvService) {
    this.configService = configService;
  }

  async onModuleDestroy() {
    // Clean up connections when the module is destroyed
    await this.disconnect();
  }

  async connect() {
    // Create a new client instance
    this.client = new MultiServerMCPClient({
      throwOnLoadError: true,
      prefixToolNameWithServerName: false,
      additionalToolNamePrefix: "",
      mcpServers: {
        productPassport: {
          transport: "http",
          url: this.configService.get("OPEN_DPP_MCP_URL"),
          reconnect: {
            enabled: true,
            maxAttempts: 5,
            delayMs: 2000,
          },
        },
      },
    });
    await this.client.initializeConnections();
    this.logger.log(`Connected to MCP server: ${this.configService.get("OPEN_DPP_MCP_URL")}`);

    return this.client;
  }

  async getClient() {
    if (!this.client) {
      await this.connect();
    }

    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
    }
  }

  async getTools(...servers: string[]) {
    return await this.client.getTools(...servers);
  }
}
