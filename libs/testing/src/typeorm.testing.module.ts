import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import * as path from 'path';
import { generateConfig } from '../../../apps/main/src/database/config';
import { EnvModule } from 'libs/env/src/env.module';
import { EnvService } from 'libs/env/src/env.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [EnvModule],
      useFactory: (configService: EnvService) => ({
        ...generateConfig(
          configService,
          path.join(
            __dirname,
            '../../../apps/main/src/migrations/**/*{.ts,.js}',
          ),
        ),
        entities: [
          path.join(__dirname, '../../../apps/main/src/**/*.entity{.ts,.js}'),
        ],
      }),
      inject: [EnvService],
    }),
  ],
})
export class TypeOrmTestingModule {}
