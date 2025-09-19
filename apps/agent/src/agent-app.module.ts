import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { MongooseModule } from '@nestjs/mongoose';
import { generateMongoConfig } from './database/config';
import { AiConfigurationModule } from './ai/ai-configuration/ai-configuration.module';
import { AiModule } from './ai/ai.module';
import { McpClientModule } from './ai/mcp-client/mcp-client.module';
import { PassportModule } from './ai/passports/passport.module';
import { AuthModule } from '@app/auth';
import { PermissionModule } from '@app/permission';
import { ChatGateway } from './ai/chat.gateway';
import { ChatService } from './ai/chat.service';
import { APP_GUARD } from '@nestjs/core';
import { KeycloakAuthGuard } from '@app/auth/keycloak-auth/keycloak-auth.guard';

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
            DPP_API_SERVICE_TOKEN: z.string(),
          })
          .parse(config),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...generateMongoConfig(configService),
      }),
      inject: [ConfigService],
    }),
    AiConfigurationModule,
    AiModule,
    McpClientModule,
    PermissionModule,
    AuthModule,
    PassportModule,
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
