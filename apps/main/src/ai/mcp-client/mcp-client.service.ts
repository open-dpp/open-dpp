import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { Member } from "../../identity/organizations/domain/member";
import { User } from "../../identity/users/domain/user";
import { UserRole } from "../../identity/users/domain/user-role.enum";

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
    const url = `http://localhost:${this.configService.get("OPEN_DPP_PORT")}/api/sse`;
    // Create a new client instance
    this.client = new MultiServerMCPClient({
      throwOnLoadError: true,
      prefixToolNameWithServerName: false,
      additionalToolNamePrefix: "",
      mcpServers: {
        productPassport: {
          transport: "http",
          url,
          reconnect: {
            enabled: true,
            maxAttempts: 5,
            delayMs: 2000,
          },
        },
      },
    });
    await this.client.initializeConnections();
    this.logger.log(`Connected to MCP server: ${url}`);

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

  async getTools(auth: { user: User | null; member: Member | null }) {
    return await this.client.getTools(["productPassport"], {
      headers: {
        "x-user-role": auth.user?.role ?? UserRole.ANONYMOUS,
        ...(auth.member ? { "x-member-role": auth.member?.role } : {}),
      },
    });
  }
}
