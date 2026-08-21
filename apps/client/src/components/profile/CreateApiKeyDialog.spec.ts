import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";
import PrimeVue from "primevue/config";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Select from "primevue/select";

const { createApiKey, addSuccessNotification, logErrorWithNotification } = vi.hoisted(() => ({
  createApiKey: vi.fn(),
  addSuccessNotification: vi.fn(),
  logErrorWithNotification: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: { dpp: { users: { createApiKey } } },
}));

vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification }),
}));

vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification }),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Stub Dialog so its content and footer render without the PrimeVue portal
const DialogStub = defineComponent({
  name: "Dialog",
  props: ["visible", "header"],
  emits: ["update:visible"],
  setup(props, { slots }) {
    return () =>
      props.visible
        ? h("div", { "data-testid": "dialog" }, [slots.default?.(), slots.footer?.()])
        : null;
  },
});

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      common: { cancel: "Cancel", close: "Close", copy: "Copy", clipboardSuccess: "Copied" },
      user: {
        apiKeys: {
          create: "Create API key",
          name: "Name",
          namePlaceholder: "e.g. CI pipeline",
          expiry: "Expiry",
          noExpiry: "No expiry",
          expiryDays: "{days} days",
          createdTitle: "API key created",
          createdHint: "Copy this key now. It is only shown once.",
          createError: "Could not create the API key",
          copyError: "Could not copy the key to the clipboard",
        },
      },
    },
  },
});

import CreateApiKeyDialog from "./CreateApiKeyDialog.vue";

function mountDialog() {
  return mount(CreateApiKeyDialog, {
    props: { visible: true },
    global: {
      plugins: [i18n, PrimeVue],
      components: { Button, InputText, Message, Select, Dialog: DialogStub },
    },
  });
}

describe("CreateApiKeyDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it("disables submit while the name is empty", async () => {
    const wrapper = mountDialog();
    const submit = wrapper.find('[data-testid="api-key-create-submit"]');
    expect(submit.attributes("disabled")).toBeDefined();

    await wrapper.find('[data-testid="api-key-name-input"]').setValue("CI pipeline");
    expect(submit.attributes("disabled")).toBeUndefined();
  });

  it("creates the key and reveals it exactly once", async () => {
    createApiKey.mockResolvedValue({
      data: {
        id: "key-1",
        name: "CI pipeline",
        start: "opendpp_ab",
        expiresAt: null,
        lastUsedAt: null,
        createdAt: "2026-08-21T00:00:00.000Z",
        key: "opendpp_plain_secret",
      },
    });
    const wrapper = mountDialog();

    await wrapper.find('[data-testid="api-key-name-input"]').setValue("CI pipeline");
    await wrapper.find('[data-testid="api-key-create-submit"]').trigger("click");
    await nextTick();
    await nextTick();

    expect(createApiKey).toHaveBeenCalledWith({ name: "CI pipeline", expiresInDays: null });
    expect(wrapper.emitted("created")).toHaveLength(1);
    expect(wrapper.find('[data-testid="api-key-created-value"]').text()).toBe(
      "opendpp_plain_secret",
    );
    expect(wrapper.find('[data-testid="api-key-show-once-hint"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="api-key-name-input"]').exists()).toBe(false);
  });

  it("reports an error when creation fails", async () => {
    createApiKey.mockRejectedValue(new Error("boom"));
    const wrapper = mountDialog();

    await wrapper.find('[data-testid="api-key-name-input"]').setValue("CI pipeline");
    await wrapper.find('[data-testid="api-key-create-submit"]').trigger("click");
    await nextTick();
    await nextTick();

    expect(logErrorWithNotification).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="api-key-created-value"]').exists()).toBe(false);
  });

  it("copies the created key to the clipboard", async () => {
    createApiKey.mockResolvedValue({
      data: {
        id: "key-1",
        name: "CI pipeline",
        start: "opendpp_ab",
        expiresAt: null,
        lastUsedAt: null,
        createdAt: "2026-08-21T00:00:00.000Z",
        key: "opendpp_plain_secret",
      },
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    const wrapper = mountDialog();
    await wrapper.find('[data-testid="api-key-name-input"]').setValue("CI pipeline");
    await wrapper.find('[data-testid="api-key-create-submit"]').trigger("click");
    await nextTick();
    await nextTick();

    await wrapper.find('[data-testid="api-key-copy-btn"]').trigger("click");
    await nextTick();

    expect(writeText).toHaveBeenCalledWith("opendpp_plain_secret");
    expect(addSuccessNotification).toHaveBeenCalled();
  });
});
