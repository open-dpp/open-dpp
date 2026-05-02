import { Language } from "@open-dpp/dto";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PrimeVue from "primevue/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import apiClient from "../lib/api-client.ts";
import ProfileForm from "./ProfileForm.vue";

const confirmMocks = vi.hoisted(() => ({
  require: vi.fn(),
}));

vi.mock("../lib/api-client.ts", () => ({
  default: {
    dpp: {
      users: {
        getMe: vi.fn(),
        updateProfile: vi.fn(),
        requestEmailChange: vi.fn(),
        cancelEmailChange: vi.fn(),
      },
    },
  },
}));

vi.mock("../translations/i18n.ts", () => ({
  convertLanguageToLocale: (language: string) => (language === "de" ? "de-DE" : "en-US"),
  convertLocaleToLanguage: (locale: string) => (locale === "de-DE" ? "de" : "en"),
}));

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

const SelectButtonStub = defineComponent({
  name: "SelectButton",
  props: {
    modelValue: { type: String, default: "" },
  },
  emits: ["update:modelValue"],
  setup() {
    return () => h("div", { class: "select-button-stub" });
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

function makeMount() {
  return mount(ProfileForm, {
    global: {
      plugins: [createPinia(), PrimeVue],
      stubs: {
        InputText: InputTextStub,
        Button: ButtonStub,
        Message: MessageStub,
        SelectButton: SelectButtonStub,
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

describe("ProfileForm.vue", () => {
  it("renders hydration-failed UI when getMe fails", async () => {
    (apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("boom"));
    const wrapper = makeMount();
    await flushPromises();
    expect(wrapper.text()).toContain("user.profileLoadFailed");
    expect(wrapper.find('[data-testid="retry"]').exists()).toBe(true);
  });

  it("retries hydration when retry button is clicked", async () => {
    (apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        data: { user: baseUser, pendingEmailChange: null },
      });
    const wrapper = makeMount();
    await flushPromises();
    await wrapper.find('[data-testid="retry"]').trigger("click");
    await flushPromises();
    expect(wrapper.find('[data-testid="retry"]').exists()).toBe(false);
    expect((apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });

  it("renders pending-email banner when pendingEmailChange is present", async () => {
    (apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        user: baseUser,
        pendingEmailChange: {
          newEmail: "new@example.com",
          requestedAt: new Date("2026-02-01T12:00:00Z"),
        },
      },
    });
    const wrapper = makeMount();
    await flushPromises();
    expect(wrapper.find('[data-testid="cancel-pending"]').exists()).toBe(true);
    // The pending chip text uses i18n key "user.emailPending"; new email is shown as the
    // current email label after the change is initiated, plus the chip itself shows the key.
    expect(wrapper.text()).toContain("user.emailPending");
  });

  it("requires currentPassword before submitting an email change", async () => {
    (apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: baseUser, pendingEmailChange: null },
    });
    const wrapper = makeMount();
    await flushPromises();

    // Open the email panel
    await wrapper.find('[data-testid="change-email"]').trigger("click");
    await flushPromises();

    // Type a new email but leave password empty
    const newEmailInput = wrapper.find('[data-testid="new-email"]');
    expect(newEmailInput.exists()).toBe(true);
    await newEmailInput.setValue("new@example.com");

    // Click send-verification
    await wrapper.find('[data-testid="send-verification"]').trigger("click");
    await flushPromises();

    expect(
      (apiClient.dpp.users.requestEmailChange as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBe(0);
    expect(wrapper.text()).toContain("user.emailChangeCurrentPasswordRequired");
  });

  it("surfaces a 429 from the rate limiter as a friendly message", async () => {
    (apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: baseUser, pendingEmailChange: null },
    });
    (apiClient.dpp.users.requestEmailChange as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { status: 429 },
    });
    const wrapper = makeMount();
    await flushPromises();

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

  it("opens the confirm dialog before cancelling a pending change", async () => {
    (apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        user: baseUser,
        pendingEmailChange: {
          newEmail: "new@example.com",
          requestedAt: new Date("2026-02-01T12:00:00Z"),
        },
      },
    });
    const wrapper = makeMount();
    await flushPromises();

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
    (apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        user: baseUser,
        pendingEmailChange: {
          newEmail: "new@example.com",
          requestedAt: new Date("2026-02-01T12:00:00Z"),
        },
      },
    });
    const wrapper = makeMount();
    await flushPromises();

    await wrapper.find('[data-testid="cancel-pending"]').trigger("click");
    await flushPromises();

    expect(
      (apiClient.dpp.users.cancelEmailChange as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBe(0);
  });
});
