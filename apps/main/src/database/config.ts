import { EnvService } from '@app/env/env.service';
import { ConnectionOptions } from 'tls';
import { DataSourceOptions } from 'typeorm';

export function generateConfig(
  configService: EnvService,
  migrationPath: string,
): DataSourceOptions {
  let sslValue: boolean | ConnectionOptions | undefined = configService.get('OPEN_DPP_DB_SSL'); 
  if (sslValue) {
    const sslServername = configService.get('OPEN_DPP_DB_SSL_SERVERNAME');
    if (sslServername) {
      sslValue = {
        rejectUnauthorized: true,
        servername: sslServername
      }
    } else {
      sslValue = true;
    }
  } 

  return {
    type: 'postgres',
    host: configService.get('OPEN_DPP_DB_HOST'),
    port: configService.get('OPEN_DPP_DB_PORT'),
    username: configService.get('OPEN_DPP_DB_USER'),
    password: configService.get('OPEN_DPP_DB_PASSWORD'),
    database: configService.get('OPEN_DPP_DB_DATABASE'),
    synchronize: true,
    dropSchema: false,
    extra: {
      ssl: sslValue
    },
    migrations: [migrationPath],
  };
}

export function generateMongoConfig(configService: EnvService) {

  let uri: string;
  const config_uri = configService.get('OPEN_DPP_MONGODB_URI');
  if (config_uri) {
    uri = config_uri;
  } else {
    uri = `mongodb://${configService.get('OPEN_DPP_MONGODB_HOST')}:${configService.get('OPEN_DPP_MONGODB_PORT')}/`;
  }

  return {
    uri: uri,
    user: configService.get('OPEN_DPP_MONGODB_USER'),
    pass: configService.get('OPEN_DPP_MONGODB_PASSWORD'),
    dbName: configService.get('OPEN_DPP_DB_DATABASE'),
  };
}
