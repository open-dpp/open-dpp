import type { Env } from "./env";
import type { TrustedClientEnv } from "./trusted-client";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

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
   * is disabled. `validateEnv` already guarantees the client is complete when enabled;
   * the throw only guards a ConfigService that skipped validation.
   */
  getTrustedClient(): TrustedClientEnv | undefined {
    if (!this.get("OPEN_DPP_OAUTH_PROVIDER_ENABLED")) {
      return undefined;
    }
    const clientId = this.get("OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID");
    const clientSecret = this.get("OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET");
    const redirectUris = this.get("OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS");
    if (!clientId || !clientSecret || !redirectUris || redirectUris.length === 0) {
      throw new Error(
        "OPEN_DPP_OAUTH_PROVIDER_ENABLED is set to true but the Trusted Client is not fully configured.",
      );
    }
    const clientName = this.get("OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME");
    return {
      clientId,
      clientSecret,
      redirectUris,
      ...(clientName !== undefined ? { clientName } : {}),
    };
  }
}
