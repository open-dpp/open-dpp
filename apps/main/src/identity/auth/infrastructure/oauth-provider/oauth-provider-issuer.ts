import type { EnvService } from "@open-dpp/env";
import { AUTH_BASE_PATH } from "../../auth-base-path";

/**
 * The OAuth Provider's issuer: the auth mount on the instance origin, e.g.
 * `https://host/api/v2/auth`. It is the `iss` of every token, the audience the
 * Trusted Client requests with `resource=`, and where discovery is served.
 */
export function oauthProviderIssuer(configService: EnvService): string {
  return `${new URL(configService.get("OPEN_DPP_URL")).origin}${AUTH_BASE_PATH}`;
}
