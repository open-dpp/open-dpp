import { EnvService } from "@open-dpp/env";

export function generateMongoConfig(configService: EnvService) {
  let uri: string;
  const config_uri = configService.get("OPEN_DPP_MONGODB_URI");
  if (config_uri) {
    uri = config_uri;
    return {
      uri,
    };
  }
  else {
    uri = `mongodb://${configService.get("OPEN_DPP_MONGODB_HOST")}:${configService.get("OPEN_DPP_MONGODB_PORT")}/`;
  }

  const user = configService.get("OPEN_DPP_MONGODB_USER");
  const pass = configService.get("OPEN_DPP_MONGODB_PASSWORD");
  const dbName = configService.get("OPEN_DPP_MONGODB_DATABASE");

  return {
    uri,
    user,
    pass,
    dbName,
  };
}
