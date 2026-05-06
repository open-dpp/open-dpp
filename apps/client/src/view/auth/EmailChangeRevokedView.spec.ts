import { mount } from "@vue/test-utils";
import PrimeVue from "primevue/config";
import { describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import EmailChangeRevokedView from "./EmailChangeRevokedView.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const CardStub = defineComponent({
  name: "Card",
  setup(_props, { slots, attrs }) {
    return () =>
      h("div", { ...attrs }, [
        slots.header?.(),
        slots.title?.(),
        slots.content?.(),
        slots.footer?.(),
      ]);
  },
});

const MessageStub = defineComponent({
  name: "Message",
  setup(_props, { slots, attrs }) {
    return () => h("div", { ...attrs }, slots.default?.());
  },
});

async function makeMount(query: Record<string, string> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/account/email-change-revoked", component: EmailChangeRevokedView },
      { path: "/signin", name: "Signin", component: { template: "<div />" } },
    ],
  });
  await router.push({ path: "/account/email-change-revoked", query });
  await router.isReady();

  return mount(EmailChangeRevokedView, {
    global: {
      plugins: [PrimeVue, router],
      stubs: {
        Card: CardStub,
        Message: MessageStub,
      },
    },
  });
}

describe("EmailChangeRevokedView.vue", () => {
  it("renders success state when status=ok", async () => {
    const wrapper = await makeMount({ status: "ok" });

    expect(wrapper.find('[data-testid="revoke-success"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="revoke-invalid"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("auth.emailChangeRevoked.successTitle");
    expect(wrapper.text()).toContain("auth.emailChangeRevoked.successBody");
  });

  it("renders invalid state when status=invalid", async () => {
    const wrapper = await makeMount({ status: "invalid" });

    expect(wrapper.find('[data-testid="revoke-invalid"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="revoke-success"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("auth.emailChangeRevoked.invalidTitle");
    expect(wrapper.text()).toContain("auth.emailChangeRevoked.invalidBody");
  });

  it("defaults to invalid state when no status query is present", async () => {
    const wrapper = await makeMount();

    expect(wrapper.find('[data-testid="revoke-invalid"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="revoke-success"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("auth.emailChangeRevoked.invalidTitle");
  });

  it("links to /signin in the footer", async () => {
    const wrapper = await makeMount({ status: "ok" });

    const link = wrapper.find("a");
    expect(link.exists()).toBe(true);
    expect(link.attributes("href")).toBe("/signin");
    expect(link.text()).toContain("auth.emailChangeRevoked.ctaSignIn");
  });
});
