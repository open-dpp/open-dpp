import { join } from "node:path";
import { HttpModule } from "@nestjs/axios";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ServeStaticModule } from "@nestjs/serve-static";
import { EnvModule, EnvService } from "@open-dpp/env";
import { AasModule } from "./aas/aas.module";
import { AiConfigurationModule } from "./ai/ai-configuration/ai-configuration.module";
import { AiModule } from "./ai/ai.module";
import { ChatGateway } from "./ai/presentation/chat.gateway";
import { AnalyticsModule } from "./analytics/analytics.module";
import { BrandingModule } from "./branding/branding.module";
import { LoggerMiddleware } from "./common/middleware/logger.middleware";
import { generateMongoConfig } from "./database/config";
import { EmailModule } from "./email/email.module";
import { AuthModule } from "./identity/auth/auth.module";
import { AuthGuard } from "./identity/auth/infrastructure/guards/auth.guard";
import { OrganizationsModule } from "./identity/organizations/organizations.module";
import { UsersModule } from "./identity/users/users.module";
import { InstanceSettingsModule } from "./instance-settings/instance-settings.module";
import { McpServerModule } from "./mcp/mcp.server.module";
import { MediaModule } from "./media/media.module";
import { PassportsModule } from "./passports/passports.module";
import { PolicyModule } from "./policy/policy.module";
import { PolicyGuard } from "./policy/presentation/policy.guard";
import { StatusModule } from "./status/status.module";
import { TemplatesModule } from "./templates/templates.module";
import { TraceabilityEventsModule } from "./traceability-events/traceability-events.module";
import { UniqueProductIdentifierModule } from "./unique-product-identifier/unique.product.identifier.module";
import { CorrelationIdService } from "./common/middleware/correlation-id.service";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";

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
    AasModule,
    UniqueProductIdentifierModule,
    BrandingModule,
    TemplatesModule,
    PassportsModule,
    OrganizationsModule,
    UsersModule,
    HttpModule,
    TraceabilityEventsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "client", "dist"),
      exclude: ["/api", "/api/{*test}"],
      serveStaticOptions: {
        fallthrough: true,
      },
    }),
    MediaModule,
    McpServerModule,
    AiConfigurationModule,
    AiModule,
    AnalyticsModule,
    AuthModule,
    EmailModule,
    InstanceSettingsModule,
    PolicyModule,
    StatusModule,
  ],
  controllers: [],
  providers: [
    CorrelationIdService,
    ChatGateway,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PolicyGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
