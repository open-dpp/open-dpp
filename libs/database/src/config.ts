import { ConfigService } from '@nestjs/config';

export function generateMongoConfig(configService: ConfigService) {
  return {
    uri: `mongodb://${configService.get('MONGO_DB_HOST')}:${configService.get('MONGO_DB_PORT')}/`,
    user: configService.get('DB_USERNAME'),
    pass: configService.get('DB_PASSWORD'),
    dbName: configService.get('DB_DATABASE'),
  };
}
