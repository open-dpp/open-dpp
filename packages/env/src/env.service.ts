import type { Env } from "./env";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EnvService {
  private configService: ConfigService<Env, true>;

  constructor(
    configService: ConfigService,
  ) {
    this.configService = configService as unknown as ConfigService<Env, true>;
  }

  get<T extends keyof Env>(key: T) {
    return this.configService.get(key, { infer: true });
  }
}
