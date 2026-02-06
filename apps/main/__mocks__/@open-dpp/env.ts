import process from "node:process";
import { Module } from "@nestjs/common";

export class EnvService {
  get(key: string) {
    if (key === "OPEN_DPP_MONGODB_URI")
      return process.env.OPEN_DPP_MONGODB_URI;
    if (key === "NODE_ENV")
      return "test";
    if (key.includes("PORT"))
      return 9000;
    if (key.includes("ENDPOINT"))
      return "localhost";
    if (key.includes("SSL"))
      return false;
    return "http://localhost:3000";
  }
}

@Module({
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {
  static forRoot() {
    return {
      module: EnvModule,
      providers: [EnvService],
      exports: [EnvService],
    };
  }
}

export function validateEnv(config: any) {
  return config;
}
