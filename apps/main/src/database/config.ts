import { randomUUID } from "node:crypto";
import process from "node:process";
import { EnvService } from "@open-dpp/env";

export function generateMongoConfig(configService: EnvService) {
  let uri: string;
  const config_uri = configService.get("OPEN_DPP_MONGODB_URI");
  if (config_uri) {
    uri = config_uri;
    if (process.env.NODE_ENV === "test") {
      const dbName = `test-${randomUUID()}`;
      if (uri.includes("?")) {
        const [base, query] = uri.split("?");
        uri = base.endsWith("/") ? `${base}${dbName}?${query}` : `${base}/${dbName}?${query}`;
      }
      else {
        uri = uri.endsWith("/") ? `${uri}${dbName}` : `${uri}/${dbName}`;
      }
    }
    return {
      uri,
    };
  }
  else {
    const host = configService.get("OPEN_DPP_MONGODB_HOST");
    const port = configService.get("OPEN_DPP_MONGODB_PORT");
    uri = `mongodb://${host}:${port}/`;

    if (host === "localhost" || host === "127.0.0.1") {
      uri += "?directConnection=true";
    }
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
