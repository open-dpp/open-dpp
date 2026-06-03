import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { getByPassport } = vi.hoisted(() => ({
  getByPassport: vi.fn().mockResolvedValue({
    data: [
      {
        id: "permalink-1",
        slug: "my-product",
        baseUrl: null,
        publishedUrl: null,
        instanceBaseUrl: "https://example.com",
      },
    ],
  }),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      permalinks: {
        getByPassport,
        update: vi.fn().mockResolvedValue({
          data: { id: "permalink-1", slug: "my-product", baseUrl: null, publishedUrl: null },
        }),
      },
    },
  },
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

// Stub Pinia stores used by this component's dependencies
vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification: vi.fn() }),
}));
vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification: vi.fn() }),
}));

// Stub Dialog to render slot content when visible
vi.mock("primevue/dialog", () => ({
  default: defineComponent({
    name: "Dialog",
    props: ["visible"],
    emits: ["update:visible"],
    setup(props, { slots }) {
      return () =>
        h("div", { class: "dialog-stub" }, [
          props.visible ? slots.default?.() : null,
          props.visible ? slots.footer?.() : null,
        ]);
    },
  }),
}));

const InputTextStub = defineComponent({
  name: "InputText",
  props: ["modelValue", "disabled", "invalid", "placeholder", "id"],
  emits: ["update:modelValue"],
  template: `<input :value="modelValue" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`,
});

const ButtonStub = defineComponent({
  name: "Button",
  props: ["label", "disabled", "severity", "variant"],
  emits: ["click"],
  setup(props, { emit }) {
    return () =>
      h("button", { onClick: () => emit("click"), disabled: props.disabled }, props.label);
  },
});

// ---------------------------------------------------------------------------
// i18n setup — includes the per-passport baseUrl warning key
// ---------------------------------------------------------------------------

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      common: {
        cancel: "Cancel",
        save: "Save",
      },
      permalink: {
        notfound: "No permalink found.",
        settings: {
          title: "Permalink settings",
          loadError: "Could not load.",
          saveError: "Could not save.",
          saveSuccess: "Saved.",
          slugConflict: "Slug conflict.",
          slugInvalid: "Slug invalid.",
          baseUrlInvalid: "Base URL invalid.",
          locked: "Locked.",
          slug: {
            label: "Short name",
            placeholder: "Slug placeholder",
          },
          baseUrl: {
            label: "Custom base URL",
            description: "Override the organization's default permalink URL for this passport.",
            warning:
              "Setting a custom URL here overrides the organization default. Leave blank to inherit the configured URL.",
          },
          preview: {
            label: "Preview",
            invalid: "Preview unavailable.",
            usingAutoId: "Using auto-generated ID.",
            source: {
              permalink: "Base URL set for this passport.",
              branding: "Base URL inherited from the organization.",
              instance: "Base URL inherited from the instance default.",
            },
          },
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Import component after mocks
// ---------------------------------------------------------------------------
import PermalinkSettingsDialog from "./PermalinkSettingsDialog.vue";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PermalinkSettingsDialog — per-passport override warning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the amber warning banner for the custom base URL field", async () => {
    const wrapper = mount(PermalinkSettingsDialog, {
      global: {
        plugins: [i18n],
        stubs: { InputText: InputTextStub, Button: ButtonStub },
      },
      props: { visible: true, passportId: "passport-1" },
    });

    await nextTick();
    // Allow the async watch to fetch the permalink
    await nextTick();

    const warning = wrapper.find("[data-testid='base-url-override-warning']");
    expect(warning.exists()).toBe(true);
    expect(warning.text()).toContain(
      "Setting a custom URL here overrides the organization default.",
    );
  });

  it("does not render the base-url-override-warning when permalink is not loaded", async () => {
    // permalink loads as empty array → no permalink object → no fields rendered
    getByPassport.mockResolvedValueOnce({ data: [] });

    const wrapper = mount(PermalinkSettingsDialog, {
      global: {
        plugins: [i18n],
        stubs: { InputText: InputTextStub, Button: ButtonStub },
      },
      props: { visible: true, passportId: "passport-1" },
    });

    await nextTick();
    await nextTick();

    // The entire template block is hidden, so no warning
    const warning = wrapper.find("[data-testid='base-url-override-warning']");
    expect(warning.exists()).toBe(false);
  });
});
