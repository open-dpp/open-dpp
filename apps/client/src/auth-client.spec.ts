import { afterEach, describe, expect, it, vi } from "vitest";

const TRUSTED_CLIENT_REDIRECT = "https://landing.example/auth/open-dpp?code=c1&state=s1";

/** How the OAuth Provider answers a sign-in that resumed a Trusted Client's authorize request. */
const providerResumed = () =>
  vi.fn(
    async () =>
      new Response(JSON.stringify({ redirect: true, url: TRUSTED_CLIENT_REDIRECT }), {
        headers: { "content-type": "application/json" },
      }),
  );

describe("authClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("leaves the hand-over to the Trusted Client to the page, so the browser navigates once", async () => {
    vi.stubEnv("VITE_API_ROOT", "http://localhost/api");
    // the client keeps the fetch it was created with
    vi.stubGlobal("fetch", providerResumed());
    const { authClient } = await import("./auth-client");
    // jsdom cannot navigate: record where anything sends the browser instead
    const navigations: string[] = [];
    vi.stubGlobal("window", {
      ...window,
      location: {
        get href() {
          return "http://localhost/signin";
        },
        set href(url: string) {
          navigations.push(url);
        },
      },
    });

    const { data } = await authClient.signIn.email({ email: "a@example.com", password: "pw" });

    // the page's own continuation (resumeFromResponse) navigates with this answer
    expect(data).toMatchObject({ redirect: true, url: TRUSTED_CLIENT_REDIRECT });
    expect(navigations).toEqual([]);
  });
});
