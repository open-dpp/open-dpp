/**
 * Tests that the PassportListView correctly wires the QR code dialog.
 *
 * Bug: v-model="qrCodeDialogVisible" was used instead of v-model:visible="qrCodeDialogVisible".
 * PassportQrCodeDialog exposes defineModel('visible'), so the bare v-model maps to the default
 * model (undefined name) and the dialog never opens. Correct usage: v-model:visible.
 */

import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";
import type { DigitalProductDocumentDto, PassportPaginationDto } from "@open-dpp/dto";
import { DigitalProductDocumentStatusDto } from "@open-dpp/dto";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { getByPassport, routerPush, routerReplace } = vi.hoisted(() => ({
  getByPassport: vi.fn().mockResolvedValue({ data: [] }),
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      passports: {
        getAll: vi.fn().mockResolvedValue({
          data: { paging_metadata: { cursor: null }, result: [] } satisfies PassportPaginationDto,
        }),
      },
      permalinks: {
        getByPassport,
      },
    },
  },
}));

vi.mock("../../lib/axios", () => ({
  default: { get: vi.fn(), post: vi.fn() },
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
  useRoute: () => ({ query: {}, path: "/passports" }),
  useRouter: () => ({ push: routerPush, replace: routerReplace }),
}));

vi.mock("primevue/usetoast", () => ({ useToast: () => ({ add: vi.fn() }) }));
vi.mock("primevue/useconfirm", () => ({ useConfirm: () => ({ require: vi.fn() }) }));

// Stub heavy UI components to avoid PrimeVue plugin requirement
vi.mock("../../components/digital-product-document/DigitalProductDocumentTable.vue", () => ({
  default: defineComponent({
    name: "DigitalProductDocumentTable",
    props: ["items", "loading", "hasNext", "hasPrevious", "currentPage", "selectedStatus"],
    emits: ["resetCursor", "nextPage", "previousPage", "update:selectedStatus"],
    setup(props, { slots }) {
      return () =>
        h("div", { "data-testid": "dpt" }, [
          slots.headerActions?.() ?? null,
          ...(props.items ?? []).map((item: DigitalProductDocumentDto) =>
            slots.actions?.({ item, goToItem: vi.fn() }),
          ),
        ]);
    },
  }),
}));

vi.mock("../../components/passport/PassportCreateDialog.vue", () => ({
  default: defineComponent({
    name: "PassportCreateDialog",
    setup() {
      return { open: vi.fn() };
    },
    template: "<div />",
  }),
}));

vi.mock(
  "../../components/digital-product-document/DigitalProductDocumentStatusChangeMenu.vue",
  () => ({
    default: defineComponent({
      name: "DigitalProductDocumentStatusChangeMenu",
      props: ["item"],
      template: "<div />",
    }),
  }),
);

// Stub Dialog so it renders its default slot when visible=true
vi.mock("primevue/dialog", () => ({
  default: defineComponent({
    name: "Dialog",
    props: ["visible"],
    emits: ["update:visible"],
    setup(props, { slots }) {
      return () =>
        props.visible
          ? h("div", { "data-testid": "qr-dialog-content" }, slots.default?.() ?? [])
          : null;
    },
  }),
}));

vi.mock("@vueuse/core", () => ({
  useClipboard: () => ({ copy: vi.fn() }),
  useWindowSize: () => ({ width: ref(1024), height: ref(768) }),
}));

// Stub PassportQrCodeDialog: we need a transparent pass-through that uses
// defineModel('visible') so that the watch in the real component fires.
// However, since we're testing the VIEW's wiring, we use the real component
// (imported below) and just stub its heavy dependencies above (Dialog, vueuse, etc.).
// The real PassportQrCodeDialog IS our component under test for the integration.

// Stub PrimeVue components that are globally registered via unplugin-vue-components
// but not available in the Vitest environment.
vi.mock("primevue/button", () => ({
  default: defineComponent({
    name: "Button",
    props: ["label", "icon", "severity", "ariaLabel", "title", "disabled", "variant"],
    emits: ["click"],
    setup(props, { emit }) {
      return () =>
        h(
          "button",
          {
            "aria-label": props.ariaLabel,
            title: props.title,
            onClick: (e: Event) => emit("click", e),
          },
          props.label ?? "",
        );
    },
  }),
}));

vi.mock("primevue/fileupload", () => ({
  default: defineComponent({
    name: "FileUpload",
    props: ["mode", "auto", "accept", "chooseLabel", "disabled", "customUpload"],
    emits: ["select"],
    template: "<div />",
  }),
}));

vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      passports: { label: "Passports" },
      common: {
        add: "Add",
        import: "Import",
        qrCode: "QR Code",
        edit: "Edit",
        view: "View",
        exportPassport: "Export",
        presentationMode: "Presentation Mode",
        copy: "Copy",
        clipboardSuccess: "Copied",
      },
      permalink: { notfound: "No permalink" },
    },
  },
});

import PassportListView from "./PassportListView.vue";
import PassportQrCodeDialog from "../../components/presentation/PassportQrCodeDialog.vue";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function makePassport(
  overrides: Partial<DigitalProductDocumentDto> = {},
): DigitalProductDocumentDto {
  return {
    id: "passport-1",
    assetAdministrationShells: [],
    lastStatusChange: {
      currentStatus: DigitalProductDocumentStatusDto.Draft,
      previousStatus: null,
      changedAt: new Date().toISOString(),
    },
    organizationId: "org-1",
    templateId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as unknown as DigitalProductDocumentDto;
}

describe("PassportListView – QR code dialog wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it("opens the QR dialog and triggers permalink fetch when the QR button is clicked", async () => {
    // Arrange: render a list with one passport item
    const passport = makePassport({ id: "passport-42" });

    // Override the getAll mock to return our passport
    const { default: apiClient } = await import("../../lib/api-client");
    (apiClient.dpp.passports.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        paging_metadata: { cursor: null },
        result: [passport as unknown as PassportPaginationDto["result"][number]],
      } satisfies PassportPaginationDto,
    });

    const wrapper = mount(PassportListView, {
      global: {
        plugins: [i18n],
        // PassportQrCodeDialog is auto-imported globally in production (unplugin-vue-components),
        // but must be explicitly registered in the test environment.
        components: { PassportQrCodeDialog },
      },
    });

    // Wait for onMounted + nextPage to finish
    await nextTick();
    await nextTick();

    // Find and click the QR button
    const qrButton = wrapper.find('button[aria-label="QR Code"]');
    expect(qrButton.exists()).toBe(true);

    await qrButton.trigger("click");
    await nextTick();

    // The dialog should now be visible, which triggers the permalink watch
    // With the bug (v-model instead of v-model:visible), the dialog's visible
    // model never gets set and the permalink fetch never fires.
    expect(getByPassport).toHaveBeenCalledOnce();
    expect(getByPassport).toHaveBeenCalledWith("passport-42");
  });
});
