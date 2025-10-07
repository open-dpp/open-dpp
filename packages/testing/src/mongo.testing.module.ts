import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { EnvModule, EnvService } from '@open-dpp/env'

export function generateMongoConfig(configService: EnvService) {
  return {
    uri: `mongodb://${configService.get('OPEN_DPP_MONGODB_HOST')}:${configService.get('OPEN_DPP_MONGODB_PORT')}/`,
    user: configService.get('OPEN_DPP_MONGODB_USER'),
    pass: configService.get('OPEN_DPP_MONGODB_PASSWORD'),
    dbName: configService.get('OPEN_DPP_DB_DATABASE'),
  }
}

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
