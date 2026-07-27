/**
 * Guards the row-level delete affordance of the passport-scoped UPI list.
 *
 * Bugs this covers (PR #615 review):
 *  - the trash button was rendered unconditionally, so deleting on a published
 *    passport or on a read-only GTIN/EAN row produced a silent 409;
 *  - the 409 was never caught, so nothing was surfaced to the user;
 *  - the button used `common.delete`, a key that exists in neither locale, so
 *    vue-i18n rendered the raw key string.
 */

import type { UniqueProductIdentifierListItemDto } from "@open-dpp/dto";
import { DigitalProductDocumentStatusDto, UniqueProductIdentifierType } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PrimeVue from "primevue/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { createI18n } from "vue-i18n";
import enUS from "../../translations/en-US.json";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { getById, getUniqueProductIdentifiers, deleteUpi, logErrorWithNotification, addSuccess } =
  vi.hoisted(() => ({
    getById: vi.fn(),
    getUniqueProductIdentifiers: vi.fn(),
    deleteUpi: vi.fn(),
    logErrorWithNotification: vi.fn(),
    addSuccess: vi.fn(),
  }));

// Captures the options handed to PrimeVue's confirm dialog so the test can run
// the accept callback without rendering the dialog.
let confirmOptions: { accept?: () => Promise<void> | void } | null = null;

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      passports: { getById, getUniqueProductIdentifiers },
      uniqueProductIdentifiers: { delete: deleteUpi },
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

vi.mock("vue-router", () => ({
  useRoute: () => ({ params: { passportId: "passport-1", organizationId: "org-1" }, query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("primevue/useconfirm", () => ({
  useConfirm: () => ({
    require: (options: { accept?: () => Promise<void> | void }) => {
      confirmOptions = options;
    },
  }),
}));

vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification }),
}));

vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification: addSuccess }),
}));

// Dialogs and the pagination bar are irrelevant here and drag in heavy
// dependencies. Each factory stays self-contained — vi.mock calls are hoisted
// above every top-level binding.
vi.mock(
  "../../components/unique-product-identifier/UniqueProductIdentifierCreateDialog.vue",
  () => ({ default: defineComponent({ template: "<div />" }) }),
);
vi.mock("../../components/unique-product-identifier/Gs1DigitalLinkPromptDialog.vue", () => ({
  default: defineComponent({ template: "<div />" }),
}));
vi.mock("../../components/permalinks/PermalinkQrCode.vue", () => ({
  default: defineComponent({ template: "<div />" }),
}));
vi.mock("../../components/pagination/TablePagination.vue", () => ({
  default: defineComponent({ template: "<div />" }),
}));

// jsdom has no matchMedia; PrimeVue's DataTable touches it.
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

import Button from "primevue/button";
import UniqueProductIdentifierListView from "./UniqueProductIdentifierListView.vue";

const messages = enUS.uniqueProductIdentifiers.list;

const i18n = createI18n({ locale: "en-US", legacy: false, messages: { "en-US": enUS } });

function makeUpi(
  overrides: Partial<UniqueProductIdentifierListItemDto> = {},
): UniqueProductIdentifierListItemDto {
  return {
    uuid: "upi-1",
    referenceId: "passport-1",
    type: UniqueProductIdentifierType.GS1,
    gtin: "04012345123456",
    batch: null,
    serial: null,
    granularity: "model",
    digitalLink: null,
    passportPublished: false,
    permalink: null,
    ...overrides,
  } as UniqueProductIdentifierListItemDto;
}

async function mountView(options: {
  status?: (typeof DigitalProductDocumentStatusDto)[keyof typeof DigitalProductDocumentStatusDto];
  upis?: UniqueProductIdentifierListItemDto[];
}) {
  getById.mockResolvedValue({
    data: {
      lastStatusChange: { currentStatus: options.status ?? DigitalProductDocumentStatusDto.Draft },
    },
  });
  getUniqueProductIdentifiers.mockResolvedValue({
    data: { paging_metadata: { cursor: null }, result: options.upis ?? [makeUpi()] },
  });

  const wrapper = mount(UniqueProductIdentifierListView, {
    global: {
      plugins: [i18n, PrimeVue],
      components: { Button },
      stubs: { Dialog: true, ConfirmDialog: true },
    },
  });
  // onMounted awaits two requests before the rows exist.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await wrapper.vm.$nextTick();
  return wrapper;
}

function deleteButton(wrapper: Awaited<ReturnType<typeof mountView>>) {
  return wrapper.get('[data-testid="upi-delete-btn"]');
}

describe("UniqueProductIdentifierListView – delete affordance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmOptions = null;
    setActivePinia(createPinia());
  });

  it("enables delete for a GS1 row on a draft passport", async () => {
    const wrapper = await mountView({ status: DigitalProductDocumentStatusDto.Draft });

    const button = deleteButton(wrapper);
    expect(button.attributes("disabled")).toBeUndefined();
    expect(button.attributes("title")).toBe(messages.delete);
    expect(button.attributes("aria-label")).toBe(messages.delete);
  });

  it("disables delete once the passport is published and explains why", async () => {
    const wrapper = await mountView({ status: DigitalProductDocumentStatusDto.Published });

    const button = deleteButton(wrapper);
    expect(button.attributes("disabled")).toBeDefined();
    expect(button.attributes("title")).toBe(messages.deleteLockedTooltip);
  });

  it("disables delete for an archived passport too (the backend guard is draft-only)", async () => {
    const wrapper = await mountView({ status: DigitalProductDocumentStatusDto.Archived });

    expect(deleteButton(wrapper).attributes("disabled")).toBeDefined();
  });

  it("disables delete for read-only GTIN system rows on a draft passport", async () => {
    const wrapper = await mountView({
      status: DigitalProductDocumentStatusDto.Draft,
      upis: [makeUpi({ type: UniqueProductIdentifierType.GTIN })],
    });

    const button = deleteButton(wrapper);
    expect(button.attributes("disabled")).toBeDefined();
    expect(button.attributes("title")).toBe(messages.systemReadOnly);
  });

  it("never leaks an unresolved translation key into the markup", async () => {
    const wrapper = await mountView({ status: DigitalProductDocumentStatusDto.Draft });

    expect(wrapper.html()).not.toContain("common.delete");
    expect(wrapper.html()).not.toContain("uniqueProductIdentifiers.list.");
  });

  it("notifies on a successful delete", async () => {
    const wrapper = await mountView({ status: DigitalProductDocumentStatusDto.Draft });
    deleteUpi.mockResolvedValue(undefined);

    await deleteButton(wrapper).trigger("click");
    await confirmOptions?.accept?.();

    expect(deleteUpi).toHaveBeenCalledWith("upi-1");
    expect(addSuccess).toHaveBeenCalledWith(messages.deleteSuccess);
    expect(logErrorWithNotification).not.toHaveBeenCalled();
  });

  it("surfaces a rejected delete instead of failing silently", async () => {
    const wrapper = await mountView({ status: DigitalProductDocumentStatusDto.Draft });
    const error = new Error("409");
    deleteUpi.mockRejectedValue(error);

    await deleteButton(wrapper).trigger("click");
    await expect(confirmOptions?.accept?.()).resolves.toBeUndefined();

    expect(logErrorWithNotification).toHaveBeenCalledWith(messages.deleteError, error);
    expect(addSuccess).not.toHaveBeenCalled();
  });
});
