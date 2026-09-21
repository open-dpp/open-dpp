import { z } from "zod";

/**
 * The single external application an operator configured to use open-dpp as its
 * OAuth Provider (see CONTEXT.md: Trusted Client). Present only while
 * `OPEN_DPP_OAUTH_PROVIDER_ENABLED` is true; every field then comes from env.
 */
export interface TrustedClientEnv {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUris: readonly string[];
  readonly clientName?: string;
}

// RFC 6761 loopback names plus the IPv4 loopback block and IPv6 loopback, as the
// OAuth Provider plugin allows them (`isLoopbackHost` in @better-auth/core).
const LOOPBACK_HOSTNAME = /^(localhost|.+\.localhost|127(\.\d{1,3}){3}|\[::1\])$/i;

function isLoopbackUrl(url: URL): boolean {
  return LOOPBACK_HOSTNAME.test(url.hostname);
}

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

/** True for https, for http on loopback, and for unparseable values (`z.url` reports those). */
function isHttpsOrLoopback(value: string): boolean {
  const url = parseUrl(value);
  return url === undefined || url.protocol === "https:" || isLoopbackUrl(url);
}

/**
 * One redirect URI of the Trusted Client. Mirrors the rule the OAuth Provider plugin
 * applies to every `redirect_uri` at authorize time (`SafeUrlSchema` in
 * @better-auth/core), narrowed to web clients: an absolute http(s) URL without a
 * fragment (RFC 6749 §3.1.2), https everywhere except on loopback hosts.
 */
export const trustedClientRedirectUriSchema = z
  .url({ protocol: /^https?$/ })
  .refine((value) => !value.includes("#"), {
    message: "Redirect URI must not contain a fragment",
  })
  .refine(isHttpsOrLoopback, {
    message: "Redirect URI must use https (http is allowed only on loopback hosts)",
  });

/** Comma-separated redirect URIs as written in env, parsed into a non-empty list. */
export const trustedClientRedirectUrisSchema = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((uri) => uri.trim())
      .filter((uri) => uri.length > 0),
  )
  .pipe(
    z
      .array(trustedClientRedirectUriSchema)
      .min(1, { message: "At least one redirect URI is required" }),
  );
