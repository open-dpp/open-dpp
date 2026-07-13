import { randomUUID } from "node:crypto";
import process from "node:process";
import { EnvService } from "@open-dpp/env";
import { MongooseModuleFactoryOptions } from "@nestjs/mongoose";

export function generateMongoConfig(
  configService: EnvService,
): MongooseModuleFactoryOptions {
  const config_uri = configService.get("OPEN_DPP_MONGODB_URI");
  if (config_uri) {
    // In test mode, replace the database name with a random one (test-<uuid>)
    // to ensure each test run uses an isolated database and tests don't
    // interfere with each other.
    if (process.env.NODE_ENV === "test") {
      const dbName = `test-${randomUUID()}`;

      return {
        dbName,
        uri: config_uri,
      };
    }

    return {
      uri: config_uri,
    };
  }

  const host = configService.get("OPEN_DPP_MONGODB_HOST");
  const port = configService.get("OPEN_DPP_MONGODB_PORT");
  const uri = `mongodb://${host}:${port}/`;
  const directConnection = host === "localhost" || host === "127.0.0.1"
  const user = configService.get("OPEN_DPP_MONGODB_USER");
  const pass = configService.get("OPEN_DPP_MONGODB_PASSWORD");
  const dbName = configService.get("OPEN_DPP_MONGODB_DATABASE");

  return {
    uri,
    directConnection,
    user,
    pass,
    dbName,
  };
}
