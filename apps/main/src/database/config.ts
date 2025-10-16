import { EnvService } from "@open-dpp/env";

export function generateMongoConfig(configService: EnvService) {
  let uri: string;
  const config_uri = configService.get("OPEN_DPP_MONGODB_URI");
  if (config_uri) {
    uri = config_uri;
  }
  else {
    uri = `mongodb://${configService.get("OPEN_DPP_MONGODB_HOST")}:${configService.get("OPEN_DPP_MONGODB_PORT")}/`;
  }

  return {
    uri,
    user: configService.get("OPEN_DPP_MONGODB_USER"),
    pass: configService.get("OPEN_DPP_MONGODB_PASSWORD"),
    dbName: configService.get("OPEN_DPP_MONGODB_DATABASE"),
  };
}
