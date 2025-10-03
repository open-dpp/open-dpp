import { EnvService } from '@app/env/env.service';
import { DataSourceOptions } from 'typeorm';

export function generateConfig(
  configService: EnvService,
  migrationPath: string,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: configService.get('OPEN_DPP_DB_HOST'),
    port: configService.get('OPEN_DPP_DB_PORT'),
    username: configService.get('OPEN_DPP_DB_USER'),
    password: configService.get('OPEN_DPP_DB_PASSWORD'),
    database: configService.get('OPEN_DPP_DB_DATABASE'),
    synchronize: true,
    dropSchema: false,
    migrations: [migrationPath],
  };
}

export function generateMongoConfig(configService: EnvService) {
  return {
    uri: `mongodb://${configService.get('OPEN_DPP_MONGODB_HOST')}:${configService.get('OPEN_DPP_MONGODB_PORT')}/`,
    user: configService.get('OPEN_DPP_MONGODB_USER'),
    pass: configService.get('OPEN_DPP_MONGODB_PASSWORD'),
    dbName: configService.get('OPEN_DPP_DB_DATABASE'),
  };
}
