import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class McpClientService implements OnModuleInit, OnModuleDestroy {
  private client: MultiServerMCPClient;
  private readonly configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  async onModuleInit() {
    // Initialize the client when the module is initialized
    await this.connect();
  }

  async onModuleDestroy() {
    // Clean up connections when the module is destroyed
    await this.disconnect();
  }

  private async connect() {
    // Create a new client instance
    this.client = new MultiServerMCPClient({
      throwOnLoadError: true,
      prefixToolNameWithServerName: false,
      additionalToolNamePrefix: "",
      mcpServers: {
        productPassport: {
          transport: "http",
          url: this.configService.get<string>("MCP_URL") || "",
          reconnect: {
            enabled: true,
            maxAttempts: 5,
            delayMs: 2000,
          },
        },
      },
    });
    await this.client.initializeConnections();

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
