import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import PrimeVue from "primevue/config";
import Tab from "primevue/tab";
import TabList from "primevue/tablist";
import Tabs from "primevue/tabs";

const { routerPush } = vi.hoisted(() => ({ routerPush: vi.fn() }));

vi.mock("vue-router", () => ({
  useRoute: () => ({ path: "/profile/api-keys" }),
  useRouter: () => ({ push: routerPush }),
  RouterView: { name: "RouterView", template: "<div data-testid='router-view' />" },
}));

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      user: {
        tabs: { profile: "Profile", invitations: "Invitations", apiKeys: "API keys" },
      },
    },
  },
});

import ProfileLayout from "./ProfileLayout.vue";

describe("ProfileLayout", () => {
  it("renders one tab per profile section and marks the active route", () => {
    const wrapper = mount(ProfileLayout, {
      global: { plugins: [i18n, PrimeVue], components: { Tab, TabList, Tabs } },
    });

    expect(wrapper.find('[data-testid="profile-tab-general"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="profile-tab-invitations"]').exists()).toBe(true);
    const apiKeysTab = wrapper.find('[data-testid="profile-tab-api-keys"]');
    expect(apiKeysTab.exists()).toBe(true);
    expect(apiKeysTab.attributes("data-p-active")).toBe("true");
  });

  it("navigates when another tab is clicked", async () => {
    const wrapper = mount(ProfileLayout, {
      global: { plugins: [i18n, PrimeVue], components: { Tab, TabList, Tabs } },
    });

    await wrapper.find('[data-testid="profile-tab-invitations"]').trigger("click");
    expect(routerPush).toHaveBeenCalledWith("/profile/invitations");
  });
});
