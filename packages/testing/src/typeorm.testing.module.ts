import type { DynamicModule, Type } from '@nestjs/common'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EnvModule, EnvService } from '@open-dpp/env'

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
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            type: 'postgres',
            host: configService.get('OPEN_DPP_DB_HOST'),
            port: configService.get('OPEN_DPP_DB_PORT'),
            username: configService.get('OPEN_DPP_DB_USER'),
            password: configService.get('OPEN_DPP_DB_PASSWORD'),
            database: configService.get('OPEN_DPP_DB_DATABASE'),
            synchronize: true,
            dropSchema: false,
            autoLoadEntities: true,
            entities,
          }),
          inject: [EnvService],
        }),
        TypeOrmModule.forFeature(entities),
      ],
      exports: [TypeOrmModule],
    }
  }
}
