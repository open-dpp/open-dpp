import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";

// ---------------------------------------------------------------------------
// Mocks — declared before the component import so vi.mock hoisting picks them
// up. We expose mock state via vi.hoisted so tests can inspect calls.
// ---------------------------------------------------------------------------

const { getInstanceSettings } = vi.hoisted(() => ({
  getInstanceSettings: vi.fn().mockResolvedValue({
    data: {
      signupEnabled: { value: true },
      organizationCreationEnabled: { value: true },
      permalinkBaseUrl: { value: null },
      effectiveFallback: "https://example.com",
    },
  }),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      instanceSettings: {
        get: getInstanceSettings,
        update: vi.fn(),
      },
    },
  },
}));

vi.mock("../../auth-client.ts", () => ({
  authClient: {},
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

vi.mock("primevue", () => ({
  useToast: () => ({ add: vi.fn() }),
}));

vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification: vi.fn() }),
}));

// Stubs for heavy PrimeVue components
const CardStub = defineComponent({
  name: "Card",
  setup(_props, { slots }) {
    return () => h("div", { class: "card-stub" }, [slots.content?.()]);
  },
});

const InputTextStub = defineComponent({
  name: "InputText",
  props: ["modelValue", "disabled", "invalid", "placeholder"],
  emits: ["update:modelValue", "blur", "keyup"],
  template: `<input :value="modelValue" :disabled="disabled" @blur="$emit('blur')" />`,
});

const ToggleStub = defineComponent({
  name: "ToggleSwitch",
  props: ["modelValue"],
  emits: ["update:modelValue"],
  template: `<input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)" />`,
});

// ---------------------------------------------------------------------------
// i18n setup — includes the danger zone keys we are adding
// ---------------------------------------------------------------------------

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      organizations: {
        admin: {
          instanceSettings: {
            title: "Instance Settings",
            saved: "Settings saved.",
            error: "Error saving settings.",
            errorLoading: "Error loading settings.",
            lockedByEnv: "Controlled by env.",
            signupEnabled: {
              title: "Public signup enabled",
              description: "Signup description.",
            },
            organizationCreationEnabled: {
              title: "Org creation enabled",
              description: "Org description.",
            },
            permalinkBaseUrl: {
              title: "Passport URL",
              description: "URL where published passport pages are served.",
              warning:
                "Changing or clearing this URL will break ALL existing QR codes. This setting is only needed when running a custom passport viewer.",
              placeholder: "https://dpp.example.com",
              effectiveFallback: "Currently effective: {url}",
              invalid: "Must be a valid http(s) URL.",
              dangerZone: "Danger Zone",
            },
          },
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Import component under test AFTER mocks
// ---------------------------------------------------------------------------
import SettingsAdminView from "./SettingsAdminView.vue";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountView() {
  return mount(SettingsAdminView, {
    global: {
      plugins: [i18n],
      stubs: {
        Card: CardStub,
        InputText: InputTextStub,
        ToggleSwitch: ToggleStub,
        InstanceSettingToogle: { template: "<div />" },
        InstanceSettingUrlInput: { template: "<div data-testid='url-input' />" },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SettingsAdminView — Danger Zone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a danger zone section for the Passport URL setting", async () => {
    const wrapper = mountView();
    await nextTick();
    // The danger zone section should be present
    const dangerZone = wrapper.find("[data-testid='permalink-danger-zone']");
    expect(dangerZone.exists()).toBe(true);
  });

  it("renders the warning message inside the danger zone", async () => {
    const wrapper = mountView();
    await nextTick();
    const warning = wrapper.find("[data-testid='permalink-danger-warning']");
    expect(warning.exists()).toBe(true);
    expect(warning.text()).toContain(
      "Changing or clearing this URL will break ALL existing QR codes",
    );
  });

  it("wraps the InstanceSettingUrlInput inside the danger zone section", async () => {
    const wrapper = mountView();
    await nextTick();
    const dangerZone = wrapper.find("[data-testid='permalink-danger-zone']");
    const urlInput = dangerZone.find("[data-testid='url-input']");
    expect(urlInput.exists()).toBe(true);
  });

  it("does not render a GS1 resolver domain section", async () => {
    const wrapper = mountView();
    await nextTick();
    expect(wrapper.find("[data-testid='gs1-resolver-section']").exists()).toBe(false);
  });
});
