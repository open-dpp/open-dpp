/**
 * Tests for SidebarContent navigation
 *
 * Slice 69 — Sidebar entry → UPI list
 */

import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import { defineComponent } from "vue";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

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

vi.mock("../../auth-client", () => ({
  authClient: {
    useSession: () => ({
      value: { data: { user: { role: "user" } } },
    }),
    organization: { setActive: vi.fn() },
  },
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      organizations: { getMemberOrganizations: vi.fn().mockResolvedValue({ data: [] }) },
    },
    status: { get: vi.fn().mockResolvedValue({ data: { version: "1.0.0" } }) },
  },
}));

vi.mock("../../lib/axios", () => ({
  default: { get: vi.fn(), post: vi.fn() },
  setAxiosOrganizationId: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ path: "/organizations/org-1/unique-product-identifiers" }),
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: defineComponent({
    name: "RouterLink",
    props: ["to"],
    template: `<a :href="typeof to === 'string' ? to : to?.path ?? ''"><slot /></a>`,
  }),
}));

vi.mock("../../stores/status", () => ({
  useStatusStore: () => ({ version: "1.0.0", fetchStatus: vi.fn() }),
}));

vi.mock("../../stores/organizations", () => ({
  useOrganizationsStore: () => ({
    fetchOrganizations: vi.fn(),
    fetchCurrentOrganization: vi.fn(),
  }),
}));

vi.mock("../../stores/user", () => ({
  useUserStore: () => ({
    fetchMemberRole: vi.fn(),
  }),
}));

vi.mock("../../composables/branding", () => ({
  useBranding: () => ({ src: null }),
}));

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      uniqueProductIdentifiers: {
        label: "Unique Product Identifier | Unique Product Identifiers",
      },
      passports: { label: "Passport | Passports" },
      templates: { label: "Template | Templates" },
      integrations: { integrations: "Integrations" },
      analytics: { analytics: "Analytics" },
      organizations: {
        organizations: "Organizations",
        settings: { title: "Settings" },
        admin: {
          title: "Admin",
          organizations: "Organizations",
          users: "Users",
          settings: "Settings",
        },
      },
      members: { members: "Members" },
      media: { media: "Media" },
      permalink: {
        list: { label: "Permalink | Permalinks" },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

import SidebarContent from "./SidebarContent.vue";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SidebarContent — UPI nav entry (Slice 69)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does NOT show a UPI nav entry — UPIs moved to the per-passport dropdown", async () => {
    // Override the index store to have a selected organization
    const pinia = createPinia();
    setActivePinia(pinia);

    // Set up index store with selected org
    const { useIndexStore } = await import("../../stores");
    const indexStore = useIndexStore();
    indexStore.selectOrganization("test-org-id");

    const wrapper = mount(SidebarContent, {
      global: {
        plugins: [pinia, i18n],
        stubs: {
          BrandingLogo: { template: "<div />" },
          SelectOrganization: { template: "<div />" },
          RouterLink: defineComponent({
            name: "RouterLink",
            props: ["to"],
            template: `<a :data-to="typeof to === 'string' ? to : JSON.stringify(to)"><slot /></a>`,
          }),
        },
      },
    });

    // Find all router-link anchors
    const links = wrapper.findAll("a[data-to]");

    // There should be a link pointing to the UPI list
    const upiLink = links.find((link) =>
      link.attributes("data-to")?.includes("unique-product-identifiers"),
    );

    expect(upiLink).toBeUndefined();
  });

  it("hides the UPI nav entry when no org is selected", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    // Index store has no selected org (default null)
    const { useIndexStore } = await import("../../stores");
    const indexStore = useIndexStore();
    // Ensure selectedOrganization is null
    indexStore.selectOrganization(null);

    const wrapper = mount(SidebarContent, {
      global: {
        plugins: [pinia, i18n],
        stubs: {
          BrandingLogo: { template: "<div />" },
          SelectOrganization: { template: "<div />" },
          RouterLink: defineComponent({
            name: "RouterLink",
            props: ["to"],
            template: `<a :data-to="typeof to === 'string' ? to : JSON.stringify(to)"><slot /></a>`,
          }),
        },
      },
    });

    const links = wrapper.findAll("a[data-to]");
    const upiLink = links.find((link) =>
      link.attributes("data-to")?.includes("unique-product-identifiers"),
    );

    expect(upiLink).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Slice 78 — Permalink sidebar entry
// ---------------------------------------------------------------------------

describe("SidebarContent — Permalink nav entry (Slice 78)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does NOT show a Permalink nav entry — permalinks moved to the per-passport dropdown", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const { useIndexStore } = await import("../../stores");
    const indexStore = useIndexStore();
    indexStore.selectOrganization("test-org-id");

    const wrapper = mount(SidebarContent, {
      global: {
        plugins: [pinia, i18n],
        stubs: {
          BrandingLogo: { template: "<div />" },
          SelectOrganization: { template: "<div />" },
          RouterLink: defineComponent({
            name: "RouterLink",
            props: ["to"],
            template: `<a :data-to="typeof to === 'string' ? to : JSON.stringify(to)"><slot /></a>`,
          }),
        },
      },
    });

    const links = wrapper.findAll("a[data-to]");

    const permalinkLink = links.find((link) =>
      link.attributes("data-to")?.includes("/organizations/test-org-id/permalinks"),
    );

    expect(permalinkLink).toBeUndefined();
  });

  it("hides the Permalink nav entry when no org is selected (show() === false)", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const { useIndexStore } = await import("../../stores");
    const indexStore = useIndexStore();
    indexStore.selectOrganization(null);

    const wrapper = mount(SidebarContent, {
      global: {
        plugins: [pinia, i18n],
        stubs: {
          BrandingLogo: { template: "<div />" },
          SelectOrganization: { template: "<div />" },
          RouterLink: defineComponent({
            name: "RouterLink",
            props: ["to"],
            template: `<a :data-to="typeof to === 'string' ? to : JSON.stringify(to)"><slot /></a>`,
          }),
        },
      },
    });

    const links = wrapper.findAll("a[data-to]");
    const permalinkLink = links.find((link) => link.attributes("data-to")?.endsWith("/permalinks"));

    expect(permalinkLink).toBeUndefined();
  });
});
