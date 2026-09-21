import type { Auth } from "better-auth";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { AUTH } from "../../auth.provider";
import { SessionMapper } from "../../infrastructure/mappers/session.mapper";
import {
  AccessTokenVerifier,
  createAccessTokenVerifier,
  VerifiedAccessToken,
} from "../../infrastructure/oauth-provider/access-token-verifier";
import { oauthProviderIssuer } from "../../infrastructure/oauth-provider/oauth-provider.issuer";

export interface VerifiedApiKey {
  userId: string;
}

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);
  /** Present only while the OAuth Provider is enabled. */
  private readonly accessTokenVerifier: AccessTokenVerifier | undefined;

  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    configService: EnvService,
  ) {
    const trustedClient = configService.getTrustedClient();
    this.accessTokenVerifier = trustedClient
      ? createAccessTokenVerifier({
          issuer: oauthProviderIssuer(configService),
          clientId: trustedClient.clientId,
          // the jwt plugin's own endpoint, read from the database: no HTTP self-call
          jwksFetch: async () => (this.auth.api as any).getJwks(),
        })
      : undefined;
  }

  /** True while the OAuth Provider is enabled: a bearer access token is then a credential. */
  get acceptsAccessTokens(): boolean {
    return this.accessTokenVerifier !== undefined;
  }

  async getSession(headers: Headers) {
    const betterAuthSession = await this.auth.api.getSession({
      headers,
    });
    if (!betterAuthSession) {
      return null;
    }
    return SessionMapper.toDomainFromBetterAuth(betterAuthSession.session);
  }

  async verifyApiKey(key: string): Promise<VerifiedApiKey | null> {
    const result = await (this.auth.api as any).verifyApiKey({
      body: { key },
    });
    if (!result?.valid || !result?.key) {
      return null;
    }
    return { userId: result.key.referenceId };
  }

  /**
   * Verifies a Trusted Client access token in process and answers whom it acts for,
   * or null for any token that is not a live, User-bound token of the Trusted Client.
   * Always null while the OAuth Provider is disabled.
   */
  async verifyAccessToken(token: string): Promise<VerifiedAccessToken | null> {
    if (!this.accessTokenVerifier) {
      return null;
    }
    const verification = await this.accessTokenVerifier(token).catch((error: unknown) => {
      // not a verdict on the token: the signing keys could not be read (see KeySetUnavailableError)
      this.logger.error("Trusted Client access token could not be verified", error);
      throw error;
    });
    if (verification.status === "rejected") {
      this.logger.debug(`Rejected Trusted Client access token: ${verification.reason}`);
      return null;
    }
    return verification.token;
  }
}
