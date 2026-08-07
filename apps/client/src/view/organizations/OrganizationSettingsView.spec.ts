import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { getBranding, setBranding, updateOrganization } = vi.hoisted(() => ({
  getBranding: vi.fn(),
  setBranding: vi.fn(),
  updateOrganization: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      branding: { get: getBranding, set: setBranding },
      organizations: { update: updateOrganization },
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

const applyBranding = vi.fn();
vi.mock("../../composables/branding", () => ({
  useBranding: () => ({ applyBranding }),
}));

const logErrorWithNotification = vi.fn();
const addSuccessNotification = vi.fn();
vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification }),
}));
vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification }),
}));
vi.mock("../../stores", () => ({
  useIndexStore: () => ({ selectedOrganization: "org-1" }),
}));
vi.mock("../../stores/organizations", () => ({
  useOrganizationsStore: () => ({
    fetchOrganizations: vi.fn(),
    fetchCurrentOrganization: vi.fn().mockResolvedValue({ id: "org-1", name: "Acme" }),
  }),
}));

// MediaInput pulls in heavy media plumbing; stub it out.
vi.mock("../../components/media/MediaInput.vue", () => ({
  default: defineComponent({ name: "MediaInput", template: "<div />" }),
}));

const InputTextStub = defineComponent({
  name: "InputText",
  props: ["modelValue", "disabled", "invalid", "placeholder", "id"],
  emits: ["update:modelValue"],
  template: `<input :id="id" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
});

const ButtonStub = defineComponent({
  name: "Button",
  props: ["label", "disabled", "severity"],
  emits: ["click"],
  template: `<button :disabled="disabled" @click="$emit('click')">{{ label }}</button>`,
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
      common: { save: "Save", reset: "Reset" },
      organizations: {
        settings: { title: "Configure organization", branding: "Branding" },
        form: {
          name: { label: "Name", error: "err" },
          image: { label: "Logo" },
          color: { label: "Color", palette: "Palette", description: "desc" },
          permalinkBaseUrl: { label: "Passport URL", description: "desc" },
          updateError: "Failed",
          updateSuccess: "Saved",
        },
      },
    },
  },
});

import OrganizationSettingsView from "./OrganizationSettingsView.vue";

function mountView() {
  return mount(OrganizationSettingsView, {
    global: {
      plugins: [i18n],
      stubs: {
        InputText: InputTextStub,
        Button: ButtonStub,
        ColorPicker: PassthroughStub("ColorPicker"),
        InputGroup: PassthroughStub("InputGroup"),
        InputGroupAddon: PassthroughStub("InputGroupAddon"),
        ContentViewWrapper: PassthroughStub("ContentViewWrapper"),
      },
    },
  });
}

describe("OrganizationSettingsView — permalink base URL override", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBranding.mockResolvedValue({
      data: { logo: null, primaryColor: null, permalinkBaseUrl: null },
    });
    setBranding.mockResolvedValue({
      data: { logo: null, primaryColor: null, permalinkBaseUrl: null },
    });
    updateOrganization.mockResolvedValue({ data: { id: "org-1", name: "Acme" } });
  });

  it("renders the permalink base URL override field", async () => {
    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.find("#permalinkBaseUrl").exists()).toBe(true);
  });

  it("sends the permalinkBaseUrl on save", async () => {
    getBranding.mockResolvedValue({
      data: {
        logo: null,
        primaryColor: null,
        permalinkBaseUrl: "https://dpp.acme.com",
      },
    });
    const wrapper = mountView();
    await flushPromises();

    const saveButton = wrapper.findAll("button").find((b) => b.text() === "Save");
    await saveButton!.trigger("click");
    await flushPromises();

    expect(setBranding).toHaveBeenCalledTimes(1);
    expect(setBranding.mock.calls[0]![0]).toMatchObject({
      permalinkBaseUrl: "https://dpp.acme.com",
    });
  });
});
