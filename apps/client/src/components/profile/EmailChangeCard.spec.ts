import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import EmailChangeCard from "./EmailChangeCard.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: ref("en") }),
}));
vi.mock("primevue/useconfirm", () => ({ useConfirm: () => ({ require: vi.fn() }) }));
vi.mock("../../composables/users-repo.ts", () => ({
  useUsersRepo: () => ({ resendMyVerificationEmail: vi.fn() }),
}));
vi.mock("../../lib/api-client", () => ({ default: { dpp: { users: {} } } }));

// PrimeVue needs its plugin to render; a plain <button> keeps data-testid reachable.
const ButtonStub = defineComponent({
  name: "Button",
  props: ["label"],
  setup(props, { attrs }) {
    return () => h("button", attrs, props.label ?? "");
  },
});

function mountCard(props: { mailEnabled: boolean; pendingEmailChange?: { newEmail: string } }) {
  return mount(EmailChangeCard, {
    global: { stubs: { Button: ButtonStub, InputText: true, Message: true, Skeleton: true } },
    props: {
      email: "ada@example.com",
      emailVerified: false,
      loaded: true,
      hydrationFailed: false,
      pendingEmailChange: props.pendingEmailChange
        ? { ...props.pendingEmailChange, requestedAt: new Date() }
        : null,
      mailEnabled: props.mailEnabled,
    },
  });
}

describe("EmailChangeCard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("offers change-email, resend-verification and the not-verified badge when mail is on", () => {
    const wrapper = mountCard({ mailEnabled: true });

    expect(wrapper.find('[data-testid="change-email"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="resend-verification"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("user.emailNotVerified");
  });

  it("hides the mail-only actions and the badge when mail is off", () => {
    const wrapper = mountCard({ mailEnabled: false });

    expect(wrapper.find('[data-testid="change-email"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="resend-verification"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain("user.emailNotVerified");
    expect(wrapper.text()).toContain("ada@example.com");
  });

  it("still lets the user cancel a pending change when mail is off", () => {
    const wrapper = mountCard({
      mailEnabled: false,
      pendingEmailChange: { newEmail: "new@example.com" },
    });

    expect(wrapper.find('[data-testid="cancel-pending"]').exists()).toBe(true);
  });
});
