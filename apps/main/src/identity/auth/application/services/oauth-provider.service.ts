import type { Auth } from "better-auth";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { ForbiddenError, NotFoundError, ValueError } from "@open-dpp/exception";
import { isAPIError } from "better-auth/api";
import { describeError } from "../../../../lib/describe-error";
import { AUTH } from "../../auth.provider";
import type { BetterAuthHeaders } from "../../domain/better-auth-headers";
import { oauthProviderIssuer } from "../../infrastructure/oauth-provider/oauth-provider-issuer";

/** The Trusted Client redirect a resumed authorization answers with: `{ redirect: true, url }`. */
function trustedClientRedirectOf(response: unknown): string | undefined {
  if (typeof response !== "object" || response === null) {
    return undefined;
  }
  const { redirect, url } = response as { redirect?: unknown; url?: unknown };
  return redirect === true && typeof url === "string" && url.length > 0 ? url : undefined;
}

/**
 * Better-auth's APIError carries an HTTP status; translate it to a domain error at the
 * boundary. `isAPIError` also recognises the better-call APIError the OAuth Provider plugin
 * throws itself; the structural cast works around the duplicate better-call types (see
 * api-keys.repository.ts).
 */
function rethrowAsDomainError(error: unknown): never {
  if (isAPIError(error)) {
    const { statusCode, body } = error as unknown as {
      statusCode?: number;
      body?: { error?: string; error_description?: string; message?: string };
    };
    if (statusCode === 401) {
      throw new ForbiddenError("Continuing the authorization requires a browser session");
    }
    throw new ValueError(
      body?.error_description ?? body?.message ?? body?.error ?? "Invalid authorization request",
    );
  }
  throw error;
}

/**
 * OAuth Provider steps that open-dpp's own pages drive through the API instead of calling
 * better-auth from the browser. Available only while the OAuth Provider is enabled.
 */
@Injectable()
export class OAuthProviderService {
  private readonly logger = new Logger(OAuthProviderService.name);

  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    private readonly envService: EnvService,
  ) {}

  /**
   * Finishes an authorization the Trusted Client started with `prompt=create`, once the
   * User has a session: the provider drops the prompt and issues the authorization code.
   *
   * @param oauthQuery the signed query the provider put on the sign-up page's URL
   * @param headers the browser session, forwarded to the provider
   * @returns the Trusted Client's redirect URI carrying the code, state and issuer
   */
  async continueAfterSignup(oauthQuery: string, headers: BetterAuthHeaders): Promise<string> {
    if (!this.envService.getTrustedClient()) {
      throw new NotFoundError("The OAuth Provider is not enabled");
    }
    const response = await this.continueWithProvider(oauthQuery, headers);
    const url = trustedClientRedirectOf(response);
    if (!url) {
      this.logger.error(
        `The OAuth Provider answered the sign-up continuation without a redirect: ${JSON.stringify(response)}`,
      );
      throw new Error("The OAuth Provider did not resume the authorization");
    }
    return url;
  }

  /** The provider's own continue endpoint on the auth mount, which this call stands in for. */
  private continueUrl(): string {
    return `${oauthProviderIssuer(this.envService)}/oauth2/continue`;
  }

  private async continueWithProvider(
    oauthQuery: string,
    headers: BetterAuthHeaders,
  ): Promise<unknown> {
    // JSON, not a redirect: the SPA navigates to the Trusted Client itself
    const requestHeaders = new Headers({ ...headers, accept: "application/json" });
    try {
      // a plugin endpoint, absent from the base Auth type (see SessionsService)
      return await (this.auth.api as any).oauth2Continue({
        body: { created: true, oauth_query: oauthQuery },
        headers: requestHeaders,
        // the provider's authorize step refuses to run without a request
        request: new Request(this.continueUrl(), { method: "POST", headers: requestHeaders }),
        asResponse: false,
      });
    } catch (error) {
      this.logger.debug(`Sign-up continuation refused: ${describeError(error)}`);
      return rethrowAsDomainError(error);
    }
  }
}
