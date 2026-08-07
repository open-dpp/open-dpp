/**
 * Tests for the passport-scoped unique-product-identifier route
 * `/organizations/:organizationId/passports/:passportId/unique-product-identifiers`.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

vi.mock("../../../const.ts", () => ({
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
// (organizations → passports → leaf), so PASSPORT_PARENT.children is built after the
// leaf route consts are defined.
import { ORGANIZATION_PASSPORTS_PARENT } from "../passports/passports";
import { PASSPORT_UNIQUE_PRODUCT_IDENTIFIERS_LIST } from "./unique-product-identifiers";

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("PASSPORT_UNIQUE_PRODUCT_IDENTIFIERS_LIST route", () => {
  it("has name 'passportUniqueProductIdentifiers'", () => {
    expect(PASSPORT_UNIQUE_PRODUCT_IDENTIFIERS_LIST.name).toBe("passportUniqueProductIdentifiers");
  });

  it("has path 'unique-product-identifiers'", () => {
    expect(PASSPORT_UNIQUE_PRODUCT_IDENTIFIERS_LIST.path).toBe("unique-product-identifiers");
  });

  it("lazy-loads the list view component", () => {
    expect(typeof PASSPORT_UNIQUE_PRODUCT_IDENTIFIERS_LIST.component).toBe("function");
  });

  it("beforeEnter sets passport-scoped breadcrumbs ending in the UPI label", async () => {
    expect(typeof PASSPORT_UNIQUE_PRODUCT_IDENTIFIERS_LIST.beforeEnter).toBe("function");

    const mockTo = { params: { organizationId: "org-1", passportId: "p-1" } };
    await (PASSPORT_UNIQUE_PRODUCT_IDENTIFIERS_LIST.beforeEnter as (to: unknown) => Promise<void>)(
      mockTo,
    );

    const { useLayoutStore } = await import("../../../stores/layout");
    const layoutStore = useLayoutStore();
    expect(layoutStore.breadcrumbs.length).toBeGreaterThanOrEqual(2);
    const last = layoutStore.breadcrumbs[layoutStore.breadcrumbs.length - 1]!;
    expect(last.name).toMatchObject({
      text: "uniqueProductIdentifiers.label",
      localized: true,
    });
  });
});

describe("passport route tree mounts the UPI list", () => {
  it("the :passportId route includes a child named 'passportUniqueProductIdentifiers'", () => {
    const passportParent = (ORGANIZATION_PASSPORTS_PARENT.children ?? []).find(
      (c) => c.path === ":passportId",
    );
    expect(passportParent).toBeDefined();
    const upiRoute = (passportParent!.children ?? []).find(
      (c) => c.name === "passportUniqueProductIdentifiers",
    );
    expect(upiRoute).toBeDefined();
    expect(upiRoute!.path).toBe("unique-product-identifiers");
  });
});
