/**
 * Represents the subset of HTTP headers that Better Auth requires
 * to identify and authenticate the current user session.
 *
 * Better Auth resolves sessions from one of these headers:
 * - `cookie`: session cookie set during login
 * - `authorization`: bearer token for API access
 * - `x-api-key`: API key for programmatic access
 */
export interface BetterAuthHeaders {
  cookie?: string;
  authorization?: string;
  "x-api-key"?: string;
}

/**
 * Extracts only the authentication-relevant headers from a full HTTP headers record.
 * Use this at the controller boundary to convert NestJS `@Headers()` into a typed value.
 */
export function extractBetterAuthHeaders(headers: Record<string, string>): BetterAuthHeaders {
  const result: BetterAuthHeaders = {};
  if (headers.cookie) {
    result.cookie = headers.cookie;
  }
  if (headers.authorization) {
    result.authorization = headers.authorization;
  }
  if (headers["x-api-key"]) {
    result["x-api-key"] = headers["x-api-key"];
  }
  return result;
}
