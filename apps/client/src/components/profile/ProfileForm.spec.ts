import type { MeDto } from "@open-dpp/dto";
import { Language } from "@open-dpp/dto";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PrimeVue from "primevue/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, type PropType } from "vue";
import apiClient from "../../lib/api-client.ts";
import ProfileForm from "./ProfileForm.vue";

vi.mock("../../lib/api-client.ts", () => ({
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

const localeRef = vi.hoisted(() => ({ current: null as { value: string } | null }));

vi.mock("vue-i18n", async () => {
  const { ref: realRef } = await import("vue");
  return {
    useI18n: () => {
      const locale = realRef("en-US");
      localeRef.current = locale;
      return {
        t: (key: string) => key,
        locale,
      };
    },
  };
});

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

// Stub that records the props handed to EmailChangeCard and exposes a button to
// emit the "updated" event the parent must react to.
const EmailChangeCardStub = defineComponent({
  name: "EmailChangeCard",
  props: {
    email: { type: String, default: "" },
    pendingEmailChange: {
      type: Object as PropType<{ newEmail: string; requestedAt: Date } | null>,
      default: null,
    },
    loaded: { type: Boolean, default: false },
    hydrationFailed: { type: Boolean, default: false },
  },
  emits: ["updated"],
  setup(props, { emit }) {
    return () =>
      h("div", { class: "email-change-card-stub", "data-testid": "email-change-card" }, [
        h("span", { "data-testid": "card-email" }, props.email),
        h(
          "span",
          { "data-testid": "card-pending" },
          props.pendingEmailChange ? props.pendingEmailChange.newEmail : "none",
        ),
        h(
          "button",
          {
            "data-testid": "card-emit-updated",
            onClick: () =>
              emit("updated", {
                user: {
                  id: "user-1",
                  email: "new@example.com",
                  firstName: "Florian",
                  lastName: "Bieck",
                  name: "Florian Bieck",
                  image: null,
                  emailVerified: true,
                  preferredLanguage: Language.de,
                  createdAt: new Date("2026-01-01T00:00:00Z"),
                  updatedAt: new Date("2026-01-01T00:00:00Z"),
                },
                pendingEmailChange: {
                  newEmail: "pending@example.com",
                  requestedAt: new Date("2026-02-01T12:00:00Z"),
                },
              } satisfies MeDto),
          },
          "emit-updated",
        ),
      ]);
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
        EmailChangeCard: EmailChangeCardStub,
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

  it("stays pristine after hydration: Save is disabled and Discard is hidden with no edits", async () => {
    (apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: baseUser, pendingEmailChange: null },
    });
    const wrapper = makeMount();
    await flushPromises();

    const saveButton = wrapper.find('button[type="submit"]');
    expect(saveButton.exists()).toBe(true);
    expect(saveButton.attributes("disabled")).toBeDefined();
    expect(wrapper.text()).not.toContain("user.discardChanges");
  });

  it("returns to a pristine form after discarding edits", async () => {
    (apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: baseUser, pendingEmailChange: null },
    });
    const wrapper = makeMount();
    await flushPromises();

    const firstNameInput = wrapper.find("#profile-first-name");
    await firstNameInput.setValue("Changed");
    await flushPromises();
    expect(wrapper.text()).toContain("user.discardChanges");

    const discardButton = wrapper
      .findAll("button")
      .find((button) => button.text() === "user.discardChanges");
    expect(discardButton).toBeTruthy();
    await discardButton!.trigger("click");
    await flushPromises();

    expect((firstNameInput.element as HTMLInputElement).value).toBe("Florian");
    expect(wrapper.find('button[type="submit"]').attributes("disabled")).toBeDefined();
    expect(wrapper.text()).not.toContain("user.discardChanges");
  });

  it("enables Save and shows Discard once a name edit makes the form dirty", async () => {
    (apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: baseUser, pendingEmailChange: null },
    });
    const wrapper = makeMount();
    await flushPromises();

    // Pristine: Save disabled.
    expect(wrapper.find('button[type="submit"]').attributes("disabled")).toBeDefined();

    await wrapper.find("#profile-first-name").setValue("Changed");
    await flushPromises();

    // Dirty: Save enabled, Discard visible. (Submitting goes through vee-validate's
    // handleSubmit, which hangs under jsdom; see project caveat — not exercised here.)
    expect(wrapper.find('button[type="submit"]').attributes("disabled")).toBeUndefined();
    expect(wrapper.text()).toContain("user.discardChanges");
  });

  it("renders EmailChangeCard with the current email and pending change as props", async () => {
    (apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        user: baseUser,
        pendingEmailChange: {
          newEmail: "pending@example.com",
          requestedAt: new Date("2026-02-01T12:00:00Z"),
        },
      },
    });
    const wrapper = makeMount();
    await flushPromises();

    expect(wrapper.find('[data-testid="email-change-card"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="card-email"]').text()).toBe(baseUser.email);
    expect(wrapper.find('[data-testid="card-pending"]').text()).toBe("pending@example.com");
  });

  it("applies the MeDto from EmailChangeCard's 'updated' event (email, pending, locale)", async () => {
    (apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: baseUser, pendingEmailChange: null },
    });
    const wrapper = makeMount();
    await flushPromises();

    expect(wrapper.find('[data-testid="card-email"]').text()).toBe("u@example.com");
    expect(wrapper.find('[data-testid="card-pending"]').text()).toBe("none");

    await wrapper.find('[data-testid="card-emit-updated"]').trigger("click");
    await flushPromises();

    // Parent applied the new user + pending and pushed them back down as props.
    expect(wrapper.find('[data-testid="card-email"]').text()).toBe("new@example.com");
    expect(wrapper.find('[data-testid="card-pending"]').text()).toBe("pending@example.com");
    // Locale mirrored from the updated user's preferredLanguage (de -> de-DE).
    expect(localeRef.current?.value).toBe("de-DE");
  });

  it("does not mark the profile form dirty when EmailChangeCard emits 'updated'", async () => {
    (apiClient.dpp.users.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: baseUser, pendingEmailChange: null },
    });
    const wrapper = makeMount();
    await flushPromises();

    await wrapper.find('[data-testid="card-emit-updated"]').trigger("click");
    await flushPromises();

    // The name/language form is untouched by an email-change update.
    expect(wrapper.text()).not.toContain("user.discardChanges");
    expect(wrapper.find('button[type="submit"]').attributes("disabled")).toBeDefined();
  });
});
