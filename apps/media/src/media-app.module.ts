import { Module } from '@nestjs/common';
import {MediaModule} from "./media/media.module";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {MongooseModule} from "@nestjs/mongoose";
import {generateMongoConfig} from "./database/config";
import {KeycloakAuthGuard} from "@app/auth/keycloak-auth/keycloak-auth.guard";
import {APP_GUARD} from "@nestjs/core";
import {HttpModule} from "@nestjs/axios";
import {AuthModule} from "@app/auth";

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
      MediaModule,
      HttpModule,
      AuthModule,
  ],
  providers: [
      {
          provide: APP_GUARD,
          useClass: KeycloakAuthGuard,
      },
  ],
})
export class MediaAppModule {}
