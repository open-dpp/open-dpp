import type { ConfigService } from '@nestjs/config'
import type { DataSourceOptions } from 'typeorm'

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

export function generateMongoConfig(configService: ConfigService) {
  return {
    uri: `mongodb://${configService.get('MONGO_DB_HOST')}:${configService.get('MONGO_DB_PORT')}/`,
    user: configService.get('DB_USERNAME'),
    pass: configService.get('DB_PASSWORD'),
    dbName: configService.get('DB_DATABASE'),
  }
}
