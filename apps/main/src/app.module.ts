import { Module } from '@nestjs/common';
import path, { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { generateConfig, generateMongoConfig } from './database/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateDraftModule } from './template-draft/template-draft.module';
import { TemplateModule } from './templates/template.module';
import { ItemsModule } from './items/items.module';
import { ModelsModule } from './models/models.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { UniqueProductIdentifierModule } from './unique-product-identifier/unique.product.identifier.module';
import { HttpModule } from '@nestjs/axios';
import { KeycloakResourcesModule } from './keycloak-resources/keycloak-resources.module';
import { TraceabilityEventsModule } from './traceability-events/traceability-events.module';
import { KeycloakSyncOnStartupModule } from './keycloak-sync-on-startup/keycloak-sync-on-startup.module';
import { IntegrationModule } from './integrations/integration.module';
import { ProductPassportModule } from './product-passport/product-passport.module';
import { APP_GUARD } from '@nestjs/core';
import { KeycloakAuthGuard } from '@app/auth/keycloak-auth/keycloak-auth.guard';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MediaModule } from './media/media.module';
import { AiModule } from './ai/ai.module';
import { CreateNonExistingUserGuard } from './users/infrastructure/create-non-existing-user.guard';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { EnvModule } from 'libs/env/src/env.module';
import { EnvService } from 'libs/env/src/env.service';
import { validateEnv } from 'libs/env/src/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => validateEnv(env),
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
          path.join(__dirname, '/migrations/**/*{.ts,.js}'),
        ),
        autoLoadEntities: true,
        migrationsTransactionMode: 'each',
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
      rootPath: join(__dirname, 'client', 'dist'),
      exclude: ['/api', '/api/{*test}'],
      serveStaticOptions: {
        fallthrough: true,
      },
    }),
    MediaModule,
    MarketplaceModule,
    AiModule,
  ],
  controllers: [],
  providers: [
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
