import { describe, expect, it } from "vitest";
import type { RouteLocationNormalizedGeneric } from "vue-router";
import { resolveAuthRedirect } from "./auth-guard.ts";

const ORIGIN = "https://dpp.example.com";

function route(
  path: string,
  {
    meta = {},
    query = {},
  }: { meta?: Record<string, boolean>; query?: Record<string, string> } = {},
): RouteLocationNormalizedGeneric {
  const search = new URLSearchParams(query).toString();
  return {
    path,
    meta,
    query,
    fullPath: search ? `${path}?${search}` : path,
  } as unknown as RouteLocationNormalizedGeneric;
}

const ANONYMOUS_ONLY = { public: true, onlyAnonymous: true };

describe("resolveAuthRedirect", () => {
  it("keeps a signed-in user off anonymous-only pages", () => {
    expect(resolveAuthRedirect(route("/signin", { meta: ANONYMOUS_ONLY }), true, ORIGIN)).toBe("/");
  });

  it("lets a signed-in user reach an anonymous-only page the OAuth Provider opened", () => {
    // prompt=login re-authentication and prompt=create must render for a signed-in user too
    const opened = route("/signin", {
      meta: ANONYMOUS_ONLY,
      query: { client_id: "lp", prompt: "login", sig: "abc" },
    });

    expect(resolveAuthRedirect(opened, true, ORIGIN)).toBeUndefined();
  });

  it("sends an anonymous user of a protected page to sign-in with the return URL", () => {
    expect(resolveAuthRedirect(route("/organizations/1/passports"), false, ORIGIN)).toEqual({
      name: "Signin",
      query: { redirect: encodeURIComponent(`${ORIGIN}/organizations/1/passports`) },
    });
  });

  it("continues otherwise", () => {
    expect(
      resolveAuthRedirect(route("/signin", { meta: ANONYMOUS_ONLY }), false, ORIGIN),
    ).toBeUndefined();
    expect(resolveAuthRedirect(route("/organizations/1/passports"), true, ORIGIN)).toBeUndefined();
  });
});
