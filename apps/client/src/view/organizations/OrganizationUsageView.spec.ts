import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";

const { getPolicies, getPublic } = vi.hoisted(() => ({
  getPolicies: vi.fn(),
  getPublic: vi.fn(),
}));

vi.mock("../../lib/api-client.ts", () => ({
  default: {
    dpp: {
      policies: { get: getPolicies },
      instanceSettings: { getPublic },
    },
  },
}));

vi.mock("../../stores/index.ts", () => ({
  useIndexStore: () => ({ selectedOrganization: "org-1" }),
}));

const ButtonStub = defineComponent({
  name: "Button",
  props: ["label", "href"],
  template: `<a :href="href">{{ label }}</a>`,
});

const PassthroughStub = (name: string) =>
  defineComponent({
    name,
    setup:
      (_p, { slots }) =>
      () =>
        h("div", slots.default?.()),
  });

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      organizations: { usage: { title: "Usage policies", manage: "Manage usage" } },
    },
  },
});

import OrganizationUsageView from "./OrganizationUsageView.vue";

function mountView() {
  return mount(OrganizationUsageView, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        PolicyRule: PassthroughStub("PolicyRule"),
        ContentViewWrapper: PassthroughStub("ContentViewWrapper"),
      },
    },
  });
}

describe("OrganizationUsageView — usage management link", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    getPolicies.mockResolvedValue({ data: {} });
  });

  it("shows a link to the usage management URL when it is configured", async () => {
    getPublic.mockResolvedValue({
      data: { signupEnabled: true, usageManagementUrl: "https://billing.example.com" },
    });

    const wrapper = mountView();
    await flushPromises();

    const link = wrapper.find('[data-testid="usage-management-link"]');
    expect(link.exists()).toBe(true);
    expect(link.attributes("href")).toBe("https://billing.example.com");
    expect(link.attributes("target")).toBe("_blank");
    expect(link.text()).toBe("Manage usage");
  });

  it("hides the link when no usage management URL is configured", async () => {
    getPublic.mockResolvedValue({ data: { signupEnabled: true } });

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[data-testid="usage-management-link"]').exists()).toBe(false);
  });
});
