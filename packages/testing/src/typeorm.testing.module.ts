import type { DataSourceOptions } from 'typeorm'
import * as path from 'node:path'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

export function generateConfig(
  configService: ConfigService,
  migrationPath: string,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    synchronize: true,
    dropSchema: false,
    migrations: [migrationPath],
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...generateConfig(
          configService,
          path.join(__dirname, '../src/migrations/**/*{.ts,.js}'),
        ),
        entities: [path.join(__dirname, '../src/**/*.entity{.ts,.js}')],
      }),
      inject: [ConfigService],
    }),
  ],
})
export class TypeOrmTestingModule {}
