import { Module } from '@nestjs/common';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...generateMongoConfig(configService),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...generateConfig(
          configService,
          path.join(__dirname, '/migrations/**/*{.ts,.js}'),
        ),
        autoLoadEntities: true,
        migrationsTransactionMode: 'each',
        migrationsRun: true,
      }),
      inject: [ConfigService],
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
      serveStaticOptions: {
        fallthrough: true,
      },
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: KeycloakAuthGuard,
    },
  ],
})
export class AppModule {}
