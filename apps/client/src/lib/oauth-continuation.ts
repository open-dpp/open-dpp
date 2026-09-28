/**
 * Sign-in through open-dpp for the Trusted Client (OAuth Provider). An unauthenticated
 * authorize request is redirected to `/signin` (or `/signup` on `prompt=create`) carrying
 * the authorize parameters plus `exp`, `ba_iat` and `sig`. That signed query IS the pending
 * request: nothing is stored server-side. The auth pages send it back as `oauth_query`
 * with the sign-in or sign-up, and the provider resumes the authorize request in-request,
 * answering `{ redirect: true, url }` with the Trusted Client's redirect URI and a code.
 */

import type { OAuthProviderNamespace } from "@open-dpp/api-client";
import { isAxiosError } from "axios";
import { navigateTo } from "./navigation.ts";

const SIGNATURE_PARAM = "sig";
const PROMPT_PARAM = "prompt";
/** The OIDC prompt with which the Trusted Client asks for a sign-up instead of a sign-in. */
const CREATE_PROMPT = "create";
/** How the API answers a continuation without a browser session: the form has to render. */
const NO_SESSION_STATUSES: readonly number[] = [401, 403];

/**
 * The signed query up to and including `sig`, serialised the way the provider signed it,
 * or undefined when the page was not opened by the OAuth Provider.
 */
export function signedOAuthQuery(search: string): string | undefined {
  const params = new URLSearchParams(search);
  if (!params.has(SIGNATURE_PARAM)) {
    return undefined;
  }
  const signed = new URLSearchParams();
  for (const [key, value] of params) {
    signed.append(key, value);
    if (key === SIGNATURE_PARAM) {
      break;
    }
  }
  return signed.toString();
}

/** Whether a parsed route query carries the provider's signature. */
export function isOAuthContinuation(query: Readonly<Record<string, unknown>>): boolean {
  const signature = query[SIGNATURE_PARAM];
  return typeof signature === "string" && signature.length > 0;
}

/** Whether the pending request asks for the given OIDC prompt (space-separated values). */
export function oauthPromptIncludes(search: string, prompt: string): boolean {
  const value = new URLSearchParams(search).get(PROMPT_PARAM);
  return value !== null && value.split(" ").includes(prompt);
}

/** Whether the Trusted Client asked for a sign-up (`prompt=create`). */
export function requestsAccountCreation(search: string): boolean {
  return oauthPromptIncludes(search, CREATE_PROMPT);
}

/** The URL a better-auth response asks the browser to continue at, when it does. */
export function continuationUrl(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) {
    return undefined;
  }
  const { redirect, url } = data as { redirect?: unknown; url?: unknown };
  return redirect === true && typeof url === "string" && url.length > 0 ? url : undefined;
}

/** The pending OAuth Provider request of an auth page, when the provider opened it. */
export interface OAuthContinuation {
  /** The signed query, sent back as `oauth_query`; undefined on a plain visit. */
  readonly oauthQuery: string | undefined;
  /** The Trusted Client asked for a sign-up (`prompt=create`). */
  readonly requestsAccountCreation: boolean;
  /** The sign-in or sign-up body, with `oauth_query` when a request is pending. */
  withOAuthQuery: <T extends object>(body: T) => T & { oauth_query?: string };
  /** Hands the browser to the URL the provider answered with; false when it did not resume. */
  resumeFromResponse: (data: unknown) => boolean;
}

/** Reads the pending request from the page's query string (`window.location.search`). */
export function readOAuthContinuation(
  search: string,
  navigate: (url: string) => void = navigateTo,
): OAuthContinuation {
  const oauthQuery = signedOAuthQuery(search);
  return {
    oauthQuery,
    requestsAccountCreation: oauthQuery !== undefined && requestsAccountCreation(search),
    withOAuthQuery: (body) => (oauthQuery ? { ...body, oauth_query: oauthQuery } : body),
    resumeFromResponse: (data) => {
      const url = oauthQuery ? continuationUrl(data) : undefined;
      if (!url) {
        return false;
      }
      navigate(url);
      return true;
    },
  };
}

export type SignupContinuationOutcome = "continued" | "not-requested" | "no-session" | "failed";

/**
 * `prompt=create`: once a session exists (right after registering, or because the User was
 * signed in already), the provider needs an explicit continue to drop the prompt and finish
 * the authorize request. The API does it for the page; without a session it refuses and the
 * sign-up form renders, whose response then resumes the request.
 */
export async function continueOAuthSignup(
  continuation: OAuthContinuation,
  client: Pick<OAuthProviderNamespace, "continueAuthorization">,
  navigate: (url: string) => void = navigateTo,
): Promise<SignupContinuationOutcome> {
  if (!continuation.oauthQuery || !continuation.requestsAccountCreation) {
    return "not-requested";
  }
  try {
    const { data } = await client.continueAuthorization({ oauthQuery: continuation.oauthQuery });
    navigate(data.url);
    return "continued";
  } catch (error) {
    if (isAxiosError(error) && NO_SESSION_STATUSES.includes(error.response?.status ?? 0)) {
      return "no-session";
    }
    console.error("Could not continue the Trusted Client's sign-up request", error);
    return "failed";
  }
}
