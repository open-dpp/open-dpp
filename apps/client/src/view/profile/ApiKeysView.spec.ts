import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";
import PrimeVue from "primevue/config";
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputText from "primevue/inputtext";
import type { ApiKeyDto } from "@open-dpp/dto";

const {
  listApiKeys,
  updateApiKey,
  deleteApiKey,
  confirmRequire,
  addSuccessNotification,
  logErrorWithNotification,
} = vi.hoisted(() => ({
  listApiKeys: vi.fn(),
  updateApiKey: vi.fn(),
  deleteApiKey: vi.fn(),
  confirmRequire: vi.fn(),
  addSuccessNotification: vi.fn(),
  logErrorWithNotification: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: { dpp: { users: { listApiKeys, updateApiKey, deleteApiKey } } },
}));

vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification }),
}));

vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification }),
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ query: {}, path: "/profile/api-keys" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("primevue/useconfirm", () => ({ useConfirm: () => ({ require: confirmRequire }) }));

vi.mock("../../components/profile/CreateApiKeyDialog.vue", () => ({
  default: defineComponent({
    name: "CreateApiKeyDialog",
    props: ["visible"],
    emits: ["update:visible", "created"],
    template: '<div data-testid="create-dialog-stub" v-if="visible" />',
  }),
}));

vi.mock("../../components/pagination/TablePagination.vue", () => ({
  default: defineComponent({
    name: "TablePagination",
    props: ["currentPage", "hasPrevious", "hasNext"],
    template: "<div />",
  }),
}));

const DialogStub = defineComponent({
  name: "Dialog",
  props: ["visible", "header"],
  emits: ["update:visible"],
  setup(props, { slots }) {
    return () =>
      props.visible
        ? h("div", { "data-testid": "rename-dialog" }, [slots.default?.(), slots.footer?.()])
        : null;
  },
});

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

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      common: { actions: "Actions", cancel: "Cancel", edit: "Edit", save: "Save" },
      user: {
        apiKeys: {
          title: "API keys",
          create: "Create API key",
          name: "Name",
          key: "Key",
          createdAt: "Created",
          expiresAt: "Expires",
          lastUsedAt: "Last used",
          neverUsed: "Never",
          noExpiry: "No expiry",
          renameTitle: "Rename API key",
          renameSuccess: "API key renamed",
          renameError: "Could not rename the API key",
          revoke: "Revoke",
          revokeConfirmHeader: "Revoke API key?",
          revokeConfirmMessage: "Applications using this key immediately lose access.",
          revokeSuccess: "API key revoked",
          revokeError: "Could not revoke the API key",
          loadError: "Could not load your API keys",
          empty: "No API keys yet",
        },
      },
    },
  },
});

import ApiKeysView from "./ApiKeysView.vue";

function makeApiKey(overrides: Partial<ApiKeyDto> = {}): ApiKeyDto {
  return {
    id: "key-1",
    name: "CI pipeline",
    start: "opendpp_ab",
    expiresAt: null,
    lastUsedAt: null,
    createdAt: "2026-08-21T00:00:00.000Z",
    ...overrides,
  };
}

function mountView() {
  return mount(ApiKeysView, {
    global: {
      plugins: [i18n, PrimeVue],
      components: { Button, Card, Column, DataTable, InputText, Dialog: DialogStub },
    },
  });
}

async function flush() {
  await nextTick();
  await nextTick();
  await nextTick();
}

describe("ApiKeysView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    listApiKeys.mockResolvedValue({
      data: { paging_metadata: { cursor: null }, result: [makeApiKey()] },
    });
  });

  it("lists keys with the masked start characters", async () => {
    const wrapper = mountView();
    await flush();

    expect(listApiKeys).toHaveBeenCalled();
    expect(wrapper.text()).toContain("CI pipeline");
    const masked = wrapper.find('[data-testid="api-key-masked-key-1"]');
    expect(masked.exists()).toBe(true);
    expect(masked.text()).toContain("opendpp_ab");
    expect(masked.text()).not.toContain("opendpp_ab1234");
    expect(wrapper.text()).toContain("Never");
    expect(wrapper.text()).toContain("No expiry");
  });

  it("shows the empty state without keys", async () => {
    listApiKeys.mockResolvedValue({
      data: { paging_metadata: { cursor: null }, result: [] },
    });
    const wrapper = mountView();
    await flush();

    expect(wrapper.find('[data-testid="api-keys-empty"]').exists()).toBe(true);
  });

  it("renames a key through the rename dialog", async () => {
    updateApiKey.mockResolvedValue({ data: makeApiKey({ name: "Renamed" }) });
    const wrapper = mountView();
    await flush();

    await wrapper.find('[data-testid="api-key-rename-btn-key-1"]').trigger("click");
    await nextTick();

    const input = wrapper.find('[data-testid="api-key-rename-input"]');
    expect((input.element as HTMLInputElement).value).toBe("CI pipeline");
    await input.setValue("Renamed");
    await wrapper.find('[data-testid="api-key-rename-submit"]').trigger("click");
    await flush();

    expect(updateApiKey).toHaveBeenCalledWith("key-1", { name: "Renamed" });
    expect(addSuccessNotification).toHaveBeenCalled();
    expect(listApiKeys).toHaveBeenCalledTimes(2);
  });

  it("revokes a key after confirmation", async () => {
    deleteApiKey.mockResolvedValue({ data: undefined });
    confirmRequire.mockImplementation((options: { accept: () => Promise<void> }) =>
      options.accept(),
    );
    const wrapper = mountView();
    await flush();

    await wrapper.find('[data-testid="api-key-revoke-btn-key-1"]').trigger("click");
    await flush();

    expect(deleteApiKey).toHaveBeenCalledWith("key-1");
    expect(addSuccessNotification).toHaveBeenCalled();
    expect(listApiKeys).toHaveBeenCalledTimes(2);
  });
});
