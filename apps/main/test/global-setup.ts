import process from "node:process";
import { MongoMemoryServer } from "mongodb-memory-server";

export default async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.OPEN_DPP_MONGODB_URI = mongod.getUri();

  process.env.NODE_ENV = "test";
  process.env.OPEN_DPP_URL = "http://localhost:3000";
  process.env.OPEN_DPP_SERVICE_TOKEN = "test-service-token-16chars";
  process.env.OPEN_DPP_AAS_TOKEN = "test-aas-token-16chars00";
  process.env.OPEN_DPP_MONGODB_USER = "admin";
  process.env.OPEN_DPP_MONGODB_PASSWORD = "admin";
  process.env.OPEN_DPP_MONGODB_DATABASE = "test";
  process.env.OPEN_DPP_MISTRAL_API_KEY = "test-mistral-key";
  process.env.OPEN_DPP_OLLAMA_URL = "http://localhost:11434";
  process.env.OPEN_DPP_S3_ENDPOINT = "localhost";
  process.env.OPEN_DPP_S3_PORT = "9000";
  process.env.OPEN_DPP_S3_SSL = "false";
  process.env.OPEN_DPP_S3_ACCESS_KEY = "minioadmin";
  process.env.OPEN_DPP_S3_SECRET_KEY = "minioadmin";
  process.env.OPEN_DPP_S3_DEFAULT_BUCKET = "dpp";
  process.env.OPEN_DPP_S3_PROFILE_PICTURE_BUCKET = "profile-pictures";
  process.env.OPEN_DPP_CLAMAV_URL = "http://localhost:3310";
  process.env.OPEN_DPP_CLAMAV_PORT = "3310";
  process.env.OPEN_DPP_MAIL_HOST = "localhost";
  process.env.OPEN_DPP_MAIL_PORT = "1025";
  process.env.OPEN_DPP_MAIL_USER = "admin";
  process.env.OPEN_DPP_MAIL_PASSWORD = "admin";
  process.env.OPEN_DPP_MAIL_SENDER_ADDRESS = "test@open-dpp.de";
  process.env.OPEN_DPP_AUTH_SECRET = "test-auth-secret";

  (globalThis as any).__MONGOD__ = mongod;
};
