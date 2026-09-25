import type { Env } from "./env";
import type { TrustedClientEnv } from "./trusted-client";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { parseTrustedClientEnv } from "./trusted-client";

@Injectable()
export class EnvService {
  private configService: ConfigService<Env, true>;

  constructor(configService: ConfigService) {
    this.configService = configService as unknown as ConfigService<Env, true>;
  }

  get<T extends keyof Env>(key: T) {
    return this.configService.get(key, { infer: true });
  }

  /**
   * The Trusted Client of the OAuth Provider, or `undefined` while the OAuth Provider
   * is disabled. `validateEnv` already guarantees the client is complete and valid when
   * enabled; the throw only guards a ConfigService that skipped validation.
   */
  getTrustedClient(): TrustedClientEnv | undefined {
    if (!this.get("OPEN_DPP_OAUTH_PROVIDER_ENABLED")) {
      return undefined;
    }
    // ConfigService.get falls back to raw process.env when the validated value is undefined,
    // so an empty `KEY=` arrives as ""; the parser treats it as unset
    const result = parseTrustedClientEnv({
      OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID: this.get("OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID"),
      OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET: this.get("OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET"),
      OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS: this.get("OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS"),
      OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME: this.get("OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME"),
    });
    if (!result.success) {
      const details = result.issues
        .map(({ path, message }) => `${path.join(".")}: ${message}`)
        .join("; ");
      throw new Error(
        `OPEN_DPP_OAUTH_PROVIDER_ENABLED is set to true but the Trusted Client is not fully configured (${details}).`,
      );
    }
    return result.data;
  }
}
