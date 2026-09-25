import type { OAuthProviderNamespace } from "@open-dpp/api-client";
import { AxiosError } from "axios";
import { describe, expect, it, vi } from "vitest";
import {
  continuationUrl,
  continueOAuthSignup,
  isOAuthContinuation,
  oauthPromptIncludes,
  readOAuthContinuation,
  requestsAccountCreation,
  signedOAuthQuery,
} from "./oauth-continuation.ts";

const SIGNED = "client_id=lp&state=s&exp=1&ba_iat=2&sig=abc";
const SIGNED_CREATE = "client_id=lp&prompt=create&exp=1&ba_iat=2&sig=abc";
const TRUSTED_CLIENT_REDIRECT = "https://landing.example.com/auth/callback?code=c";

function httpError(status: number): AxiosError {
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
  } as AxiosError["response"]);
}

describe("signedOAuthQuery", () => {
  it("returns the query up to and including the signature", () => {
    expect(signedOAuthQuery("?client_id=lp&state=s&exp=1&ba_iat=2&sig=abc")).toBe(
      "client_id=lp&state=s&exp=1&ba_iat=2&sig=abc",
    );
  });

  it("drops anything the page appended after the signature", () => {
    expect(signedOAuthQuery("?client_id=lp&sig=abc&redirect=%2F")).toBe("client_id=lp&sig=abc");
  });

  it("re-encodes the standard-base64 signature the way the provider signed it", () => {
    // the provider serialises with URLSearchParams: `+` `/` `=` percent-encoded, spaces as `+`
    expect(signedOAuthQuery("?scope=openid%20profile&sig=ab%2Bc%2Fd%3D")).toBe(
      "scope=openid+profile&sig=ab%2Bc%2Fd%3D",
    );
  });

  it("is undefined when the page was not opened by the OAuth Provider", () => {
    expect(signedOAuthQuery("")).toBeUndefined();
    expect(signedOAuthQuery("?redirect=%2Fpassports")).toBeUndefined();
  });
});

describe("isOAuthContinuation", () => {
  it("recognises the signature on a parsed route query", () => {
    expect(isOAuthContinuation({ client_id: "lp", sig: "abc" })).toBe(true);
    expect(isOAuthContinuation({ redirect: "/" })).toBe(false);
    expect(isOAuthContinuation({ sig: "" })).toBe(false);
    expect(isOAuthContinuation({ sig: null })).toBe(false);
  });
});

describe("oauthPromptIncludes", () => {
  it("reads the space-separated prompt values of the pending request", () => {
    expect(oauthPromptIncludes("?prompt=create&sig=abc", "create")).toBe(true);
    expect(oauthPromptIncludes("?prompt=login%20create&sig=abc", "create")).toBe(true);
    expect(oauthPromptIncludes("?prompt=login&sig=abc", "create")).toBe(false);
    expect(oauthPromptIncludes("?sig=abc", "create")).toBe(false);
  });
});

describe("continuationUrl", () => {
  it("is the URL the provider asks the browser to continue at", () => {
    expect(
      continuationUrl({ redirect: true, url: "https://landing.example.com/auth/callback?code=c" }),
    ).toBe("https://landing.example.com/auth/callback?code=c");
  });

  it("is undefined for any other response", () => {
    expect(continuationUrl({ redirect: false, url: "/" })).toBeUndefined();
    expect(continuationUrl({ redirect: true, url: "" })).toBeUndefined();
    expect(continuationUrl({ token: "t", user: {} })).toBeUndefined();
    expect(continuationUrl(null)).toBeUndefined();
  });
});

describe("requestsAccountCreation", () => {
  it("is true when the Trusted Client asked for a sign-up", () => {
    expect(requestsAccountCreation(`?${SIGNED_CREATE}`)).toBe(true);
    expect(requestsAccountCreation(`?${SIGNED}`)).toBe(false);
  });
});

describe("readOAuthContinuation", () => {
  it("adds the signed query to an auth request body when the provider opened the page", () => {
    const continuation = readOAuthContinuation(`?${SIGNED}`);

    expect(continuation.oauthQuery).toBe(SIGNED);
    expect(continuation.withOAuthQuery({ email: "a@b.c" })).toEqual({
      email: "a@b.c",
      oauth_query: SIGNED,
    });
  });

  it("leaves the body alone on a plain visit", () => {
    const continuation = readOAuthContinuation("?redirect=%2F");

    expect(continuation.oauthQuery).toBeUndefined();
    expect(continuation.withOAuthQuery({ email: "a@b.c" })).toEqual({ email: "a@b.c" });
  });

  it("hands the browser to the Trusted Client when the provider resumed the request", () => {
    const navigate = vi.fn();
    const continuation = readOAuthContinuation(`?${SIGNED}`, navigate);

    expect(continuation.resumeFromResponse({ redirect: true, url: TRUSTED_CLIENT_REDIRECT })).toBe(
      true,
    );
    expect(navigate).toHaveBeenCalledWith(TRUSTED_CLIENT_REDIRECT);
  });

  it("stays on the page for any other response or on a plain visit", () => {
    const navigate = vi.fn();

    expect(readOAuthContinuation(`?${SIGNED}`, navigate).resumeFromResponse({ token: "t" })).toBe(
      false,
    );
    expect(
      readOAuthContinuation("", navigate).resumeFromResponse({
        redirect: true,
        url: TRUSTED_CLIENT_REDIRECT,
      }),
    ).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("continueOAuthSignup", () => {
  type ContinueAuthorization = OAuthProviderNamespace["continueAuthorization"];
  const clientAnswering = (result: Promise<unknown>) => ({
    continueAuthorization: vi.fn<ContinueAuthorization>(
      () => result as ReturnType<ContinueAuthorization>,
    ),
  });

  it("finishes a prompt=create request through the API and navigates to the Trusted Client", async () => {
    const navigate = vi.fn();
    const client = clientAnswering(Promise.resolve({ data: { url: TRUSTED_CLIENT_REDIRECT } }));

    const outcome = await continueOAuthSignup(
      readOAuthContinuation(`?${SIGNED_CREATE}`),
      client,
      navigate,
    );

    expect(outcome).toBe("continued");
    expect(client.continueAuthorization).toHaveBeenCalledWith({ oauthQuery: SIGNED_CREATE });
    expect(navigate).toHaveBeenCalledWith(TRUSTED_CLIENT_REDIRECT);
  });

  it("does nothing unless the Trusted Client asked for a sign-up", async () => {
    const client = clientAnswering(Promise.resolve({ data: { url: TRUSTED_CLIENT_REDIRECT } }));

    expect(await continueOAuthSignup(readOAuthContinuation(`?${SIGNED}`), client)).toBe(
      "not-requested",
    );
    expect(await continueOAuthSignup(readOAuthContinuation(""), client)).toBe("not-requested");
    expect(client.continueAuthorization).not.toHaveBeenCalled();
  });

  it.each([401, 403])(
    "reports a missing session (%i) quietly, so the form renders",
    async (status: number) => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const navigate = vi.fn();
      const client = clientAnswering(Promise.reject(httpError(status)));

      const outcome = await continueOAuthSignup(
        readOAuthContinuation(`?${SIGNED_CREATE}`),
        client,
        navigate,
      );

      expect(outcome).toBe("no-session");
      expect(navigate).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    },
  );

  it("logs any other failure and reports it", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = httpError(500);
    const client = clientAnswering(Promise.reject(failure));

    const outcome = await continueOAuthSignup(readOAuthContinuation(`?${SIGNED_CREATE}`), client);

    expect(outcome).toBe("failed");
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), failure);
    consoleError.mockRestore();
  });
});
