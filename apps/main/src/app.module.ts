import { join } from "node:path";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ServeStaticModule } from "@nestjs/serve-static";
import { EnvModule, EnvService } from "@open-dpp/env";
import { AiConfigurationModule } from "./ai/ai-configuration/ai-configuration.module";
import { AiModule } from "./ai/ai.module";
import { PassportModule } from "./ai/passports/passport.module";
import { ChatGateway } from "./ai/presentation/chat.gateway";
import { AuthGuard } from "./auth/auth.guard";
import { AuthModule } from "./auth/auth.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { generateMongoConfig } from "./database/config";
import { EmailModule } from "./email/email.module";
import { IntegrationModule } from "./integrations/integration.module";
import { ItemsModule } from "./items/items.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { MediaModule } from "./media/media.module";
import { ModelsModule } from "./models/models.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { ProductPassportModule } from "./product-passport/product-passport.module";
import { TemplateDraftModule } from "./template-draft/template-draft.module";
import { TemplateModule } from "./templates/template.module";
import { TraceabilityEventsModule } from "./traceability-events/traceability-events.module";
import { UniqueProductIdentifierModule } from "./unique-product-identifier/unique.product.identifier.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    EnvModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [EnvModule],
      useFactory: (configService: EnvService) => ({
        ...generateMongoConfig(configService),
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
    TraceabilityEventsModule,
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
    AnalyticsModule,
    PassportModule,
    AuthModule,
    EmailModule,
  ],
  controllers: [],
  providers: [
    ChatGateway,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
