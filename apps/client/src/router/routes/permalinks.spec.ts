/**
 * Tests for the passport-scoped permalink route
 * `/organizations/:organizationId/passports/:passportId/permalinks`.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("../../const.ts", () => ({
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

// Import passports first to mirror the production load order
// (organizations → passports → leaf). passports.ts builds PASSPORT_PARENT.children
// from the leaf route consts, so it must fully evaluate the leaf modules before the
// array is constructed.
import { ORGANIZATION_PASSPORTS_PARENT } from "./passports/passports";
import { PASSPORT_PERMALINKS_LIST } from "./permalinks";

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("PASSPORT_PERMALINKS_LIST route", () => {
  it("has name 'passportPermalinks'", () => {
    expect(PASSPORT_PERMALINKS_LIST.name).toBe("passportPermalinks");
  });

  it("has path 'permalinks'", () => {
    expect(PASSPORT_PERMALINKS_LIST.path).toBe("permalinks");
  });

  it("lazy-loads the PermalinkListView component", () => {
    expect(typeof PASSPORT_PERMALINKS_LIST.component).toBe("function");
  });

  it("beforeEnter sets passport-scoped breadcrumbs ending in the permalink label", async () => {
    expect(typeof PASSPORT_PERMALINKS_LIST.beforeEnter).toBe("function");

    const mockTo = { params: { organizationId: "org-1", passportId: "p-1" } };
    await (PASSPORT_PERMALINKS_LIST.beforeEnter as (to: unknown) => Promise<void>)(mockTo);

    const { useLayoutStore } = await import("../../stores/layout");
    const layoutStore = useLayoutStore();
    // [passports list, passport, permalinks] — passport context + the list label.
    expect(layoutStore.breadcrumbs.length).toBeGreaterThanOrEqual(2);
    const last = layoutStore.breadcrumbs[layoutStore.breadcrumbs.length - 1]!;
    expect(last.name).toMatchObject({ text: "permalink.list.label", localized: true });
  });
});

describe("passport route tree mounts the permalink list", () => {
  it("the :passportId route includes a child named 'passportPermalinks'", () => {
    const passportParent = (ORGANIZATION_PASSPORTS_PARENT.children ?? []).find(
      (c) => c.path === ":passportId",
    );
    expect(passportParent).toBeDefined();
    const permalinkRoute = (passportParent!.children ?? []).find(
      (c) => c.name === "passportPermalinks",
    );
    expect(permalinkRoute).toBeDefined();
    expect(permalinkRoute!.path).toBe("permalinks");
  });
});
