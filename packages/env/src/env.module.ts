import type { DynamicModule } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./env";
import { EnvService } from "./env.service";

@Module({})
export class EnvModule {
  static forRoot(): DynamicModule {
    return {
      module: EnvModule,
      global: true,
      imports: [
        ConfigModule.forRoot({
          validate: env => validateEnv(env),
          expandVariables: true,
        }),
      ],
      providers: [EnvService],
      exports: [EnvService],
    };
  }
}
