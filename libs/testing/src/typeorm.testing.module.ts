import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import * as path from 'path';
import { generateConfig } from '../../../apps/main/src/database/config';
import { EnvModule } from '@app/env/env.module';
import { EnvService } from '@app/env/env.service';

@Module({
  imports: [
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
