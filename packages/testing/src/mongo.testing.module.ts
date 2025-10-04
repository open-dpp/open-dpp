import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'

export function generateMongoConfig(configService: ConfigService) {
  return {
    uri: `mongodb://${configService.get('MONGO_DB_HOST')}:${configService.get('MONGO_DB_PORT')}/`,
    user: configService.get('DB_USERNAME'),
    pass: configService.get('DB_PASSWORD'),
    dbName: configService.get('DB_DATABASE'),
  }
}

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
  ],
})
export class MongooseTestingModule {}
