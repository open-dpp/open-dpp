import * as path from 'node:path'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { generateConfig } from '../../../apps/main/src/database/config'

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
