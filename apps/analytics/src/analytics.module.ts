import { Module } from '@nestjs/common';
import { PassportMetricModule } from './statistics/passport-metric.module';
import { PassportModule } from './passports/passport.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { MongooseModule } from '@nestjs/mongoose';
import { generateMongoConfig } from './database/config';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '@app/auth';
import { PermissionModule } from '@app/permission';
import { APP_GUARD } from '@nestjs/core';
import { KeycloakAuthGuard } from '@app/auth/keycloak-auth/keycloak-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) =>
        z
          .object({
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
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...generateMongoConfig(configService),
      }),
      inject: [ConfigService],
    }),
    HttpModule,
    AuthModule,
    PassportMetricModule,
    PassportModule,
    PermissionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: KeycloakAuthGuard,
    },
    // KeycloakPermissionsGuard is now provided by PermissionsModule
  ],
})
export class AnalyticsModule {}
