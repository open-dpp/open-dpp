import { afterEach, describe, expect, it, vi } from "vitest";

const SIGNED = "?client_id=lp&state=s&exp=1&ba_iat=2&sig=abc";
const TRUSTED_CLIENT_REDIRECT = "https://landing.example/auth/open-dpp?code=c1&state=s1";

/** How the OAuth Provider answers a sign-in that resumed a Trusted Client's authorize request. */
const providerResumed = () =>
  vi.fn(
    async () =>
      new Response(JSON.stringify({ redirect: true, url: TRUSTED_CLIENT_REDIRECT }), {
        headers: { "content-type": "application/json" },
      }),
  );

/** jsdom cannot navigate: a window that records every full-page navigation instead. */
const recordingWindow = (navigations: string[]) => ({
  ...window,
  location: {
    get href() {
      return `http://localhost/signin${SIGNED}`;
    },
    set href(url: string) {
      navigations.push(url);
    },
    assign: (url: string) => navigations.push(url),
  },
});

describe("signing in while a Trusted Client waits", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("hands the browser to the Trusted Client once, so its single-use code is spent once", async () => {
    vi.stubEnv("VITE_API_ROOT", "http://localhost/api");
    // the auth client keeps the fetch it was created with
    vi.stubGlobal("fetch", providerResumed());
    const { authClient } = await import("../auth-client");
    const { readOAuthContinuation } = await import("./oauth-continuation");
    const navigations: string[] = [];
    vi.stubGlobal("window", recordingWindow(navigations));

    // what Signin.vue does with the form
    const continuation = readOAuthContinuation(SIGNED);
    const { data } = await authClient.signIn.email(
      continuation.withOAuthQuery({ email: "a@example.com", password: "pw" }),
    );
    const resumed = continuation.resumeFromResponse(data);

    expect(resumed).toBe(true);
    expect(navigations).toEqual([TRUSTED_CLIENT_REDIRECT]);
  });
});
