import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { AiConfigurationModule } from './ai-configuration/ai-configuration.module';
import { AiModule } from './ai.module';
import { McpClientModule } from './mcp-client/mcp-client.module';
import { AuthModule } from '@app/auth';
import { PermissionModule } from '@app/permission';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { APP_GUARD } from '@nestjs/core';
import { KeycloakAuthGuard } from '@app/auth/keycloak-auth/keycloak-auth.guard';
import { DatabaseModule } from '@app/database';
import { PassportMetadataModule } from '@app/passport-metadata';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) =>
        z
          .object({
            OLLAMA_URL: z.string(),
            MISTRAL_API_KEY: z.string(),
            MCP_URL: z.string(),
            PORT: z.string().default('5001'),
            DB_HOST: z.string(),
            DB_PORT: z.string(),
            DB_USERNAME: z.string(),
            DB_PASSWORD: z.string(),
            DB_DATABASE: z.string(),
            KEYCLOAK_NETWORK_URL: z.string(),
            KEYCLOAK_REALM: z.string(),
            KEYCLOAK_PUBLIC_URL: z.string(),
            DPP_API_URL: z.string(),
            API_SERVICE_TOKEN: z.string(),
          })
          .parse(config),
    }),
    DatabaseModule,
    AiConfigurationModule,
    AiModule,
    McpClientModule,
    PermissionModule,
    AuthModule,
    PassportMetadataModule,
    HttpModule,
  ],
  controllers: [],
  providers: [
    ChatGateway,
    ChatService,
    {
      provide: APP_GUARD,
      useClass: KeycloakAuthGuard,
    },
  ],
})
export class AgentAppModule {}
