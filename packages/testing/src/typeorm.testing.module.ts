import type { DynamicModule, Type } from '@nestjs/common'
import type { DataSourceOptions } from 'typeorm'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

export function generateConfig(
  configService: ConfigService,
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
  }
}

@Module({})
export class TypeOrmTestingModule {
  static forFeature(entities: Type[]): DynamicModule {
    return {
      module: TypeOrmTestingModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            ...generateConfig(
              configService,
            ),
            entities,
          }),
          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature(entities),
      ],
      exports: [TypeOrmModule],
    }
  }
}
