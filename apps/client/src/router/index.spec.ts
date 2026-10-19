import { describe, expect, it, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type { RouteLocationNormalizedGeneric } from "vue-router";

vi.mock("../const.ts", () => ({
  API_URL: "http://localhost:3000/api",
  MARKETPLACE_URL: "http://localhost:3000/api",
  VIEW_ROOT_URL: "http://localhost:3000",
  MEDIA_SERVICE_URL: "http://localhost:3000/api",
  AGENT_SERVER_URL: "http://localhost:3000/api",
  ANALYTICS_URL: "http://localhost:3000/api",
  AGENT_WEBSOCKET_URL: "http://localhost:3000",
  LAST_SELECTED_ORGANIZATION_ID_KEY: "open-dpp-local-last-selected-organization-id",
  LAST_SELECTED_LANGUAGE: "open-dpp-local-last-language",
  AI_INTEGRATION_ID: "ai-integration",
}));

import { scrollBehavior } from "./index.ts";

beforeEach(() => {
  setActivePinia(createPinia());
});

function route(
  path: string,
  { hash = "", query = {} }: { hash?: string; query?: Record<string, string> } = {},
): RouteLocationNormalizedGeneric {
  return { path, hash, query } as RouteLocationNormalizedGeneric;
}

describe("scrollBehavior", () => {
  it("returns the saved position when navigating via browser back/forward", () => {
    const saved = { left: 0, top: 480 };
    const result = scrollBehavior(route("/a"), route("/a"), saved);
    expect(result).toBe(saved);
  });

  it("scrolls to the target hash element when the destination has a hash", () => {
    const result = scrollBehavior(
      route("/passports/1", { hash: "#row-42" }),
      route("/passports/1"),
      null,
    );
    expect(result).toEqual({ el: "#row-42", behavior: "smooth", top: 150 });
  });

  it("does not move the scroll position when only query params change on the same path", () => {
    const result = scrollBehavior(
      route("/passports/1", { query: { edit: "submodel-1.section-2.field-3" } }),
      route("/passports/1", { query: { cursor: "abc123" } }),
      null,
    );
    expect(result).toBe(false);
  });

  it("scrolls to the top when navigating to a genuinely different path", () => {
    const result = scrollBehavior(route("/passports/2"), route("/passports/1"), null);
    expect(result).toEqual({ top: 0 });
  });
});
