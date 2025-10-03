import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { generateMongoConfig } from '../../../apps/main/src/database/config';
import { EnvService } from '@app/env/env.service';
import { EnvModule } from '@app/env/env.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [EnvModule],
      useFactory: (configService: EnvService) => ({
        ...generateMongoConfig(configService),
      }),
      inject: [EnvService],
    }),
  ],
})
export class MongooseTestingModule {}
