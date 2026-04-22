import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import type { Router } from "vue-router";
import LegacyPresentationRedirect from "./LegacyPresentationRedirect.vue";

async function bootstrap(initialUrl: string): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/presentation/:legacyPath(.*)*",
        name: "PRESENTATION_LEGACY_REDIRECT",
        component: LegacyPresentationRedirect,
      },
      { path: "/", component: { template: "<div />" } },
    ],
  });
  await router.push(initialUrl);
  await router.isReady();
  return router;
}

describe("LegacyPresentationRedirect", () => {
  const replaceSpy = vi.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    replaceSpy.mockReset();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, replace: replaceSpy, search: "" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("forwards /presentation/:uuid to the backend UPI endpoint", async () => {
    const router = await bootstrap("/presentation/abc-123");
    mount(LegacyPresentationRedirect, { global: { plugins: [router] } });

    expect(replaceSpy).toHaveBeenCalledWith("/api/unique-product-identifiers/abc-123");
  });

  it("forwards nested suffixes (e.g. /presentation/:uuid/chat)", async () => {
    const router = await bootstrap("/presentation/abc-123/chat");
    mount(LegacyPresentationRedirect, { global: { plugins: [router] } });

    expect(replaceSpy).toHaveBeenCalledWith("/api/unique-product-identifiers/abc-123/chat");
  });

  it("forwards query strings for the root legacy endpoint", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, replace: replaceSpy, search: "?reference=xyz" },
    });
    const router = await bootstrap("/presentation?reference=xyz");
    mount(LegacyPresentationRedirect, { global: { plugins: [router] } });

    expect(replaceSpy).toHaveBeenCalledWith("/api/unique-product-identifiers?reference=xyz");
  });
});
