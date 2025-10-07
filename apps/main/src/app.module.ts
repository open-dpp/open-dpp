import path, { join } from "node:path";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule, KeycloakAuthGuard } from "@open-dpp/auth";
import { EnvModule, EnvService, validateEnv } from "@open-dpp/env";
import { AiConfigurationModule } from "./ai/ai-configuration/ai-configuration.module";
import { AiModule } from "./ai/ai.module";
import { ChatService } from "./ai/chat.service";
import { McpClientModule } from "./ai/mcp-client/mcp-client.module";
import { PassportModule } from "./ai/passports/passport.module";
import { ChatGateway } from "./ai/presentation/chat.gateway";
import { generateConfig, generateMongoConfig } from "./database/config";
import { IntegrationModule } from "./integrations/integration.module";
import { ItemsModule } from "./items/items.module";
import { KeycloakResourcesModule } from "./keycloak-resources/keycloak-resources.module";
import { KeycloakSyncOnStartupModule } from "./keycloak-sync-on-startup/keycloak-sync-on-startup.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { MediaModule } from "./media/media.module";
import { ModelsModule } from "./models/models.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { ProductPassportModule } from "./product-passport/product-passport.module";
import { TemplateDraftModule } from "./template-draft/template-draft.module";
import { TemplateModule } from "./templates/template.module";
import { TraceabilityEventsModule } from "./traceability-events/traceability-events.module";
import { UniqueProductIdentifierModule } from "./unique-product-identifier/unique.product.identifier.module";
import { CreateNonExistingUserGuard } from "./users/infrastructure/create-non-existing-user.guard";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: env => validateEnv(env),
      isGlobal: true,
      expandVariables: true,
    }),
    EnvModule,
    MongooseModule.forRootAsync({
      imports: [EnvModule],
      useFactory: (configService: EnvService) => ({
        ...generateMongoConfig(configService),
      }),
      inject: [EnvService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [EnvModule],
      useFactory: (configService: EnvService) => ({
        ...generateConfig(
          configService,
          path.join(__dirname, "/migrations/**/*{.ts,.js}"),
        ),
        autoLoadEntities: true,
        migrationsTransactionMode: "each",
        migrationsRun: true,
        synchronize: true,
      }),
      inject: [EnvService],
    }),
    TemplateDraftModule,
    TemplateModule,
    ItemsModule,
    ModelsModule,
    OrganizationsModule,
    UsersModule,
    UniqueProductIdentifierModule,
    HttpModule,
    KeycloakResourcesModule,
    TraceabilityEventsModule,
    KeycloakSyncOnStartupModule,
    IntegrationModule,
    ProductPassportModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "client", "dist"),
      exclude: ["/api", "/api/{*test}"],
      serveStaticOptions: {
        fallthrough: true,
      },
    }),
    MediaModule,
    MarketplaceModule,
    AiConfigurationModule,
    AiModule,
    McpClientModule,
    PassportModule,
    AuthModule.forRoot(),
  ],
  controllers: [],
  providers: [
    ChatGateway,
    ChatService,
    {
      provide: APP_GUARD,
      useClass: KeycloakAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CreateNonExistingUserGuard,
    },
  ],
})
export class AppModule {}
