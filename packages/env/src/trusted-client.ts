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
  return URL.canParse(value) ? new URL(value) : undefined;
}

/**
 * True for https on any host and for http on loopback hosts only; false for every other
 * scheme, loopback or not, and for values that are no URL at all.
 * The rule every URL the OAuth Provider hands to a browser follows: the Trusted Client's
 * redirect URIs and, while the provider is enabled, `OPEN_DPP_URL` (the issuer's origin).
 */
export function isHttpsOrLoopbackUrl(value: string): boolean {
  const url = parseUrl(value);
  if (url === undefined) return false;
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && isLoopbackUrl(url);
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
  // `z.url` already reports a value that is no URL; zod still runs this refine on it
  .refine((value) => !URL.canParse(value) || isHttpsOrLoopbackUrl(value), {
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

/** The env variable behind each Trusted Client field. */
export const TRUSTED_CLIENT_ENV_KEYS = {
  clientId: "OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID",
  clientSecret: "OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET",
  redirectUris: "OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS",
  clientName: "OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME",
} as const;

type TrustedClientField = keyof typeof TRUSTED_CLIENT_ENV_KEYS;
export type TrustedClientEnvKey = (typeof TRUSTED_CLIENT_ENV_KEYS)[TrustedClientField];

/** The Trusted Client variables as written in env; `""` counts as unset. */
export type RawTrustedClientEnv = Partial<Record<TrustedClientEnvKey, string>>;

/** One problem with the Trusted Client variables, addressed by its env variable. */
export interface TrustedClientEnvIssue {
  readonly path: [TrustedClientEnvKey, ...PropertyKey[]];
  readonly message: string;
}

export type TrustedClientEnvResult =
  | { readonly success: true; readonly data: TrustedClientEnv }
  | { readonly success: false; readonly issues: readonly TrustedClientEnvIssue[] };

function requiredWhileEnabled(field: TrustedClientField) {
  const message = `OPEN_DPP_OAUTH_PROVIDER_ENABLED is set to true but ${TRUSTED_CLIENT_ENV_KEYS[field]} is not set.`;
  return z.string({ error: message }).min(1, { error: message });
}

const trustedClientEnvSchema = z
  .object({
    clientId: requiredWhileEnabled("clientId"),
    clientSecret: requiredWhileEnabled("clientSecret"),
    redirectUris: requiredWhileEnabled("redirectUris").pipe(trustedClientRedirectUrisSchema),
    clientName: z.string().optional(),
  })
  .transform(
    ({ clientName, ...client }): TrustedClientEnv =>
      clientName ? { ...client, clientName } : client,
  );

/**
 * Parses the Trusted Client from its env variables. The single rule behind both the
 * startup validation (only while the OAuth Provider is enabled; a disabled one ignores
 * these variables) and `EnvService.getTrustedClient()`.
 */
export function parseTrustedClientEnv(raw: RawTrustedClientEnv): TrustedClientEnvResult {
  const result = trustedClientEnvSchema.safeParse({
    clientId: raw.OPEN_DPP_OAUTH_PROVIDER_CLIENT_ID,
    clientSecret: raw.OPEN_DPP_OAUTH_PROVIDER_CLIENT_SECRET,
    redirectUris: raw.OPEN_DPP_OAUTH_PROVIDER_REDIRECT_URIS,
    clientName: raw.OPEN_DPP_OAUTH_PROVIDER_CLIENT_NAME,
  });
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    issues: result.error.issues.map(({ path: [field, ...rest], message }) => ({
      path: [TRUSTED_CLIENT_ENV_KEYS[field as TrustedClientField], ...rest],
      message,
    })),
  };
}
