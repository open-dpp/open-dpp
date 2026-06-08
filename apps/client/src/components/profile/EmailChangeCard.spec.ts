import type { MeDto } from "@open-dpp/dto";
import { Language } from "@open-dpp/dto";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PrimeVue from "primevue/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import apiClient from "../../lib/api-client.ts";
import EmailChangeCard from "./EmailChangeCard.vue";

const confirmMocks = vi.hoisted(() => ({
  require: vi.fn(),
}));

vi.mock("../../lib/api-client.ts", () => ({
  default: {
    dpp: {
      users: {
        requestEmailChange: vi.fn(),
        cancelEmailChange: vi.fn(),
      },
    },
  },
}));

vi.mock("../../translations/i18n.ts", () => ({
  convertLanguageToLocale: (language: string) => (language === "de" ? "de-DE" : "en-US"),
  convertLocaleToLanguage: (locale: string) => (locale === "de-DE" ? "de" : "en"),
}));

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

vi.mock("vue-i18n", async () => {
  const { ref: realRef } = await import("vue");
  return {
    useI18n: () => ({
      t: (key: string) => key,
      locale: realRef("en-US"),
    }),
  };
});

vi.mock("primevue/useconfirm", () => ({
  useConfirm: () => ({
    require: confirmMocks.require,
  }),
}));

const InputTextStub = defineComponent({
  name: "InputText",
  props: {
    modelValue: { type: [String, Number], default: "" },
  },
  emits: ["update:modelValue"],
  setup(props, { emit, attrs }) {
    return () =>
      h("input", {
        ...attrs,
        value: props.modelValue,
        onInput: (event: Event) => {
          emit("update:modelValue", (event.target as HTMLInputElement).value);
        },
      });
  },
});

const ButtonStub = defineComponent({
  name: "Button",
  props: {
    label: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    type: { type: String, default: "button" },
  },
  emits: ["click"],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        "button",
        {
          ...attrs,
          type: props.type,
          disabled: props.disabled || props.loading,
          onClick: (event: Event) => emit("click", event),
        },
        props.label,
      );
  },
});

const MessageStub = defineComponent({
  name: "Message",
  setup(_props, { slots, attrs }) {
    return () => h("div", { ...attrs }, slots.default?.());
  },
});

const ConfirmDialogStub = defineComponent({
  name: "ConfirmDialog",
  setup() {
    return () => h("div", { class: "confirm-dialog-stub" });
  },
});

const TransitionStub = defineComponent({
  name: "Transition",
  setup(_props, { slots }) {
    return () => slots.default?.();
  },
});

const baseUser = {
  id: "user-1",
  email: "u@example.com",
  firstName: "Florian",
  lastName: "Bieck",
  name: "Florian Bieck",
  image: null,
  emailVerified: true,
  preferredLanguage: Language.en,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

type EmailChangeCardProps = {
  email: string;
  pendingEmailChange: { newEmail: string; requestedAt: Date } | null;
  loaded: boolean;
  hydrationFailed: boolean;
};

function makeMount(props: Partial<EmailChangeCardProps> = {}) {
  return mount(EmailChangeCard, {
    props: {
      email: baseUser.email,
      pendingEmailChange: null,
      loaded: true,
      hydrationFailed: false,
      ...props,
    },
    global: {
      plugins: [createPinia(), PrimeVue],
      stubs: {
        InputText: InputTextStub,
        Button: ButtonStub,
        Message: MessageStub,
        ConfirmDialog: ConfirmDialogStub,
        Transition: TransitionStub,
      },
    },
  });
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.resetAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("EmailChangeCard.vue", () => {
  it("renders a hydration skeleton when not loaded", () => {
    const wrapper = makeMount({ loaded: false });
    expect(wrapper.find('[data-testid="change-email"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="cancel-pending"]').exists()).toBe(false);
  });

  it("renders the current email and a change button when loaded with no pending change", () => {
    const wrapper = makeMount();
    expect(wrapper.text()).toContain(baseUser.email);
    expect(wrapper.find('[data-testid="change-email"]').exists()).toBe(true);
  });

  it("renders pending-email banner when pendingEmailChange is present", () => {
    const wrapper = makeMount({
      pendingEmailChange: {
        newEmail: "new@example.com",
        requestedAt: new Date("2026-02-01T12:00:00Z"),
      },
    });
    expect(wrapper.find('[data-testid="cancel-pending"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("user.emailPending");
  });

  it("requires currentPassword before submitting an email change", async () => {
    const wrapper = makeMount();

    await wrapper.find('[data-testid="change-email"]').trigger("click");
    await flushPromises();

    const newEmailInput = wrapper.find('[data-testid="new-email"]');
    expect(newEmailInput.exists()).toBe(true);
    await newEmailInput.setValue("new@example.com");

    await wrapper.find('[data-testid="send-verification"]').trigger("click");
    await flushPromises();

    expect(
      (apiClient.dpp.users.requestEmailChange as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBe(0);
    expect(wrapper.text()).toContain("user.emailChangeCurrentPasswordRequired");
  });

  it("surfaces a 429 from the rate limiter as a friendly message", async () => {
    (apiClient.dpp.users.requestEmailChange as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { status: 429 },
    });
    const wrapper = makeMount();

    await wrapper.find('[data-testid="change-email"]').trigger("click");
    await flushPromises();

    await wrapper.find('[data-testid="new-email"]').setValue("new@example.com");
    await wrapper.find('[data-testid="current-password"]').setValue("hunter2");

    await wrapper.find('[data-testid="send-verification"]').trigger("click");
    await flushPromises();

    expect(
      (apiClient.dpp.users.requestEmailChange as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBe(1);
    expect(wrapper.text()).toContain("user.emailChangeRateLimited");
  });

  it("calls requestEmailChange exactly once when Enter is pressed in the password field", async () => {
    (apiClient.dpp.users.requestEmailChange as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        user: baseUser,
        pendingEmailChange: {
          newEmail: "new@example.com",
          requestedAt: new Date("2026-02-01T12:00:00Z"),
        },
      },
    });
    const wrapper = makeMount();

    await wrapper.find('[data-testid="change-email"]').trigger("click");
    await flushPromises();

    await wrapper.find('[data-testid="new-email"]').setValue("new@example.com");
    await wrapper.find('[data-testid="current-password"]').setValue("hunter2");

    await wrapper.find('[data-testid="current-password"]').trigger("keydown", { key: "Enter" });
    await flushPromises();

    expect(
      (apiClient.dpp.users.requestEmailChange as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBe(1);
  });

  it("emits 'updated' with the resulting MeDto after a successful email change request", async () => {
    const resultMe: MeDto = {
      user: baseUser,
      pendingEmailChange: {
        newEmail: "new@example.com",
        requestedAt: new Date("2026-02-01T12:00:00Z"),
      },
    };
    (apiClient.dpp.users.requestEmailChange as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: resultMe,
    });
    const wrapper = makeMount();

    await wrapper.find('[data-testid="change-email"]').trigger("click");
    await flushPromises();
    await wrapper.find('[data-testid="new-email"]').setValue("new@example.com");
    await wrapper.find('[data-testid="current-password"]').setValue("hunter2");
    await wrapper.find('[data-testid="send-verification"]').trigger("click");
    await flushPromises();

    const updatedEvents = wrapper.emitted("updated");
    expect(updatedEvents).toBeTruthy();
    expect(updatedEvents).toHaveLength(1);
    expect(updatedEvents?.[0]?.[0]).toEqual(resultMe);
  });

  it("opens the confirm dialog before cancelling a pending change", async () => {
    const wrapper = makeMount({
      pendingEmailChange: {
        newEmail: "new@example.com",
        requestedAt: new Date("2026-02-01T12:00:00Z"),
      },
    });

    const cancelButton = wrapper.find('[data-testid="cancel-pending"]');
    expect(cancelButton.exists()).toBe(true);
    await cancelButton.trigger("click");
    await flushPromises();

    expect(confirmMocks.require).toHaveBeenCalledTimes(1);
    const callArgs = confirmMocks.require.mock.calls[0]?.[0];
    expect(callArgs?.header).toBe("user.emailChangeConfirmTitle");
    expect(callArgs?.message).toBe("user.emailChangeConfirmMessage");
  });

  it("does not call cancelEmailChange directly when cancel-pending is clicked (only via confirm accept)", async () => {
    const wrapper = makeMount({
      pendingEmailChange: {
        newEmail: "new@example.com",
        requestedAt: new Date("2026-02-01T12:00:00Z"),
      },
    });

    await wrapper.find('[data-testid="cancel-pending"]').trigger("click");
    await flushPromises();

    expect(
      (apiClient.dpp.users.cancelEmailChange as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBe(0);
  });

  it("emits 'updated' with the resulting MeDto after confirming a pending cancellation", async () => {
    const resultMe: MeDto = { user: baseUser, pendingEmailChange: null };
    (apiClient.dpp.users.cancelEmailChange as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: resultMe,
    });
    const wrapper = makeMount({
      pendingEmailChange: {
        newEmail: "new@example.com",
        requestedAt: new Date("2026-02-01T12:00:00Z"),
      },
    });

    await wrapper.find('[data-testid="cancel-pending"]').trigger("click");
    await flushPromises();
    const accept = confirmMocks.require.mock.calls[0]?.[0]?.accept as (() => void) | undefined;
    expect(accept).toBeTypeOf("function");
    accept!();
    await flushPromises();

    expect(
      (apiClient.dpp.users.cancelEmailChange as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBe(1);
    const updatedEvents = wrapper.emitted("updated");
    expect(updatedEvents).toHaveLength(1);
    expect(updatedEvents?.[0]?.[0]).toEqual(resultMe);
  });
});
