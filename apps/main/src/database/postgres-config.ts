import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

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
  };
}
