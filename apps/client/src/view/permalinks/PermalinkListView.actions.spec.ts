/**
 * Slice 75 — Permalink list row actions: edit + show-QR (gs1-link rows only)
 *
 * Failing tests first (RED), then the implementation (GREEN).
 *
 * (a) Edit opens PermalinkEditDialog bound to the row
 * (b) 'Show QR' action ONLY on gs1-link rows opens a dialog hosting Gs1LinkQrCode
 * (c) presentation rows have no Show-QR
 * (d) editing then emitting `updated` re-fetches the list
 */

import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, inject, nextTick, provide, ref } from "vue";
import { createI18n } from "vue-i18n";
import type { PermalinkPublicDto } from "@open-dpp/dto";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { listPermalinks, routerPush, routerReplace } = vi.hoisted(() => ({
  listPermalinks: vi
    .fn()
    .mockResolvedValue({ data: { paging_metadata: { cursor: null }, result: [] } }),
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      permalinks: {
        list: listPermalinks,
        create: vi.fn(),
      },
      passports: {
        getPermalinks: listPermalinks,
      },
      uniqueProductIdentifiers: {
        list: vi
          .fn()
          .mockResolvedValue({ data: { paging_metadata: { cursor: null }, result: [] } }),
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

vi.mock("vue-router", () => ({
  useRoute: () => ({
    query: {},
    path: "/organizations/org-1/passports/p-1/permalinks",
    params: { passportId: "p-1", organizationId: "org-1" },
  }),
  useRouter: () => ({ push: routerPush, replace: routerReplace }),
}));

vi.mock("primevue/usetoast", () => ({ useToast: () => ({ add: vi.fn() }) }));
vi.mock("primevue/useconfirm", () => ({ useConfirm: () => ({ require: vi.fn() }) }));

vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification: vi.fn() }),
}));

vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Component stubs
// ---------------------------------------------------------------------------

const ROW_DATA_KEY = Symbol("rowData");

const DataTableStub = defineComponent({
  name: "DataTable",
  props: ["value", "loading"],
  setup(props, { slots }) {
    return () =>
      h("div", { "data-testid": "permalink-data-table" }, [
        slots.header?.() ?? null,
        ...(props.value ?? []).map((item: PermalinkPublicDto) =>
          h(
            {
              setup(_: unknown, { slots: innerSlots }: { slots: Record<string, unknown> }) {
                provide(ROW_DATA_KEY, item);
                return () =>
                  h(
                    "div",
                    { "data-testid": `permalink-row-${item.id}` },
                    typeof innerSlots.default === "function" ? innerSlots.default() : [],
                  );
              },
            },
            () => slots.default?.(),
          ),
        ),
      ]);
  },
});

const ColumnStub = defineComponent({
  name: "Column",
  props: ["field", "header", "style"],
  setup(_, { slots }) {
    const rowData = inject<PermalinkPublicDto | undefined>(ROW_DATA_KEY, undefined);
    return () => {
      if (slots.body && rowData !== undefined) {
        return h("div", null, slots.body({ data: rowData }));
      }
      return h("div");
    };
  },
});

const ButtonStub = defineComponent({
  name: "Button",
  inheritAttrs: false,
  props: ["label", "icon", "severity", "ariaLabel", "title", "disabled", "variant"],
  emits: ["click"],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        "button",
        {
          "data-testid": attrs["data-testid"],
          "aria-label": props.ariaLabel ?? props.label,
          onClick: (e: Event) => emit("click", e),
          disabled: props.disabled,
        },
        props.label ?? "",
      );
  },
});

const TagStub = defineComponent({
  name: "Tag",
  inheritAttrs: false,
  props: ["value", "severity"],
  setup(props, { attrs }) {
    return () =>
      h("span", { "data-testid": attrs["data-testid"], class: "tag-stub" }, props.value ?? "");
  },
});

// Stub PermalinkCreateGs1LinkDialog
const CreateGs1LinkDialogStub = defineComponent({
  name: "PermalinkCreateGs1LinkDialog",
  props: ["visible", "existingGs1LinkUpiIds"],
  emits: ["update:visible", "created"],
  setup(props) {
    return () =>
      props.visible ? h("div", { "data-testid": "permalink-create-gs1-dialog" }) : null;
  },
});

// Stub PermalinkEditDialog — exposes which permalink it was opened with
const lastEditPermalink = ref<PermalinkPublicDto | null>(null);
const editDialogVisible = ref(false);

const PermalinkEditDialogStub = defineComponent({
  name: "PermalinkEditDialog",
  props: ["visible", "permalink"],
  emits: ["update:visible", "updated"],
  setup(props, { emit }) {
    // Track which permalink was opened
    if (props.permalink) {
      lastEditPermalink.value = props.permalink;
      editDialogVisible.value = props.visible ?? false;
    }
    return () =>
      props.visible
        ? h("div", { "data-testid": "permalink-edit-dialog" }, [
            h(
              "button",
              {
                "data-testid": "stub-emit-updated",
                onClick: () => {
                  emit("updated", { ...props.permalink, updatedAt: "2026-01-02T00:00:00.000Z" });
                  emit("update:visible", false);
                },
              },
              "Emit Updated",
            ),
          ])
        : null;
  },
});

// Stub Gs1LinkQrCode
const Gs1LinkQrCodeStub = defineComponent({
  name: "Gs1LinkQrCode",
  props: ["permalink"],
  setup(props) {
    return () =>
      props.permalink
        ? h("div", { "data-testid": "gs1-link-qr-code", "data-permalink-id": props.permalink.id })
        : null;
  },
});

// Stub Dialog (for QR dialog)
const DialogStub = defineComponent({
  name: "Dialog",
  props: ["visible", "modal", "header"],
  emits: ["update:visible"],
  setup(props, { slots }) {
    return () =>
      props.visible ? h("div", { "data-testid": "qr-dialog" }, slots.default?.() ?? []) : null;
  },
});

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      permalink: {
        list: {
          label: "Permalink | Permalinks",
          kind: "Kind",
          publicUrl: "Public URL",
          primary: "Primary",
          published: "Published",
          kindPresentation: "Presentation",
          kindGs1Link: "GS1 Digital Link",
          createGs1Link: "Create GS1 link",
          empty: "No permalinks found.",
          actions: "Actions",
          edit: "Edit",
          showQr: "Show QR",
        },
        createGs1Link: {
          title: "Create GS1 Digital Link",
          selectUpi: "Select UPI",
          upiAlreadyLinked: "This UPI already has a GS1 Digital Link permalink.",
          baseUrl: {
            label: "Custom base URL (optional)",
            placeholder: "e.g. https://id.example.com",
          },
          gs1DataAttributes: "GS1 Data Attributes (optional)",
          conflict: "A GS1 Digital Link permalink for this UPI already exists.",
          submit: "Create",
        },
        edit: {
          title: "Edit Permalink",
        },
      },
      common: {
        add: "Add",
        edit: "Edit",
        qrCode: "QR code",
      },
      gs1LinkQrCode: {
        empty: "No GS1 Digital Link permalink.",
        digitalLink: { label: "GS1 Digital Link" },
        elementString: { label: "GS1 element string" },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const PRESENTATION_PERMALINK: PermalinkPublicDto = {
  id: "pl-presentation-1",
  kind: "presentation",
  slug: "my-passport",
  baseUrl: null,
  publishedUrl: null,
  presentationConfigurationId: "config-uuid-1",
  uniqueProductIdentifierId: null,
  primary: true,
  gs1DataAttributes: null,
  publicUrl: "https://example.com/p/my-passport",
  fallbackBaseUrl: "https://example.com",
  fallbackBaseUrlSource: "instance",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const GS1_LINK_PERMALINK: PermalinkPublicDto = {
  id: "pl-gs1-1",
  kind: "gs1-link",
  slug: null,
  baseUrl: null,
  publishedUrl: null,
  presentationConfigurationId: null,
  uniqueProductIdentifierId: "upi-uuid-42",
  primary: false,
  gs1DataAttributes: { "17": "251231" },
  publicUrl: "https://id.example.com/01/04006381333931",
  fallbackBaseUrl: "https://id.example.com",
  fallbackBaseUrlSource: "instance",
  createdAt: "2024-01-02T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

import PermalinkListView from "./PermalinkListView.vue";

function mountView() {
  lastEditPermalink.value = null;
  editDialogVisible.value = false;

  return mount(PermalinkListView, {
    global: {
      plugins: [i18n],
      stubs: {
        DataTable: DataTableStub,
        Column: ColumnStub,
        Button: ButtonStub,
        Tag: TagStub,
        PermalinkCreateGs1LinkDialog: CreateGs1LinkDialogStub,
        PermalinkEditDialog: PermalinkEditDialogStub,
        Gs1LinkQrCode: Gs1LinkQrCodeStub,
        Dialog: DialogStub,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PermalinkListView row actions (Slice 75)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    listPermalinks.mockResolvedValue({ data: { paging_metadata: { cursor: null }, result: [] } });
  });

  describe("(a) Edit opens PermalinkEditDialog bound to the row", () => {
    it("clicking the Edit button on a row opens PermalinkEditDialog with that row's permalink", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [PRESENTATION_PERMALINK, GS1_LINK_PERMALINK],
        },
      });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      // There should be an Edit button for each row
      const presentationEditBtn = wrapper.find(
        `[data-testid='permalink-edit-btn-${PRESENTATION_PERMALINK.id}']`,
      );
      expect(presentationEditBtn.exists()).toBe(true);

      // Click the edit button for the presentation permalink
      await presentationEditBtn.trigger("click");
      await nextTick();

      // The edit dialog should now be visible
      const editDialog = wrapper.find("[data-testid='permalink-edit-dialog']");
      expect(editDialog.exists()).toBe(true);

      // It should be bound to the presentation permalink
      expect(lastEditPermalink.value?.id).toBe(PRESENTATION_PERMALINK.id);
    });

    it("clicking Edit on the gs1-link row opens PermalinkEditDialog bound to that row", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [PRESENTATION_PERMALINK, GS1_LINK_PERMALINK],
        },
      });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      const gs1EditBtn = wrapper.find(
        `[data-testid='permalink-edit-btn-${GS1_LINK_PERMALINK.id}']`,
      );
      expect(gs1EditBtn.exists()).toBe(true);

      await gs1EditBtn.trigger("click");
      await nextTick();

      const editDialog = wrapper.find("[data-testid='permalink-edit-dialog']");
      expect(editDialog.exists()).toBe(true);
      expect(lastEditPermalink.value?.id).toBe(GS1_LINK_PERMALINK.id);
    });
  });

  describe("(b) Show QR action ONLY on gs1-link rows opens a dialog hosting Gs1LinkQrCode", () => {
    it("a gs1-link row has a Show QR button that opens a QR dialog with Gs1LinkQrCode", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [PRESENTATION_PERMALINK, GS1_LINK_PERMALINK],
        },
      });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      // gs1-link row should have a Show QR button
      const qrBtn = wrapper.find(`[data-testid='permalink-show-qr-btn-${GS1_LINK_PERMALINK.id}']`);
      expect(qrBtn.exists()).toBe(true);

      // Initially no QR dialog
      expect(wrapper.find("[data-testid='qr-dialog']").exists()).toBe(false);

      // Click the QR button
      await qrBtn.trigger("click");
      await nextTick();

      // QR dialog should now be visible
      expect(wrapper.find("[data-testid='qr-dialog']").exists()).toBe(true);

      // Gs1LinkQrCode should be inside the QR dialog
      const qrCode = wrapper.find("[data-testid='gs1-link-qr-code']");
      expect(qrCode.exists()).toBe(true);

      // It should be bound to the gs1-link permalink
      expect(qrCode.attributes("data-permalink-id")).toBe(GS1_LINK_PERMALINK.id);
    });
  });

  describe("(c) presentation rows have no Show-QR", () => {
    it("presentation row does not have a Show QR button", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [PRESENTATION_PERMALINK, GS1_LINK_PERMALINK],
        },
      });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      // Presentation row should NOT have a Show QR button
      const presentationQrBtn = wrapper.find(
        `[data-testid='permalink-show-qr-btn-${PRESENTATION_PERMALINK.id}']`,
      );
      expect(presentationQrBtn.exists()).toBe(false);
    });
  });

  describe("(d) editing then emitting `updated` re-fetches the list", () => {
    it("after the PermalinkEditDialog emits 'updated', the list is re-fetched", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [PRESENTATION_PERMALINK, GS1_LINK_PERMALINK],
        },
      });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      // Initial fetch was called once
      expect(listPermalinks).toHaveBeenCalledTimes(1);

      // Open the edit dialog for a row
      const editBtn = wrapper.find(`[data-testid='permalink-edit-btn-${GS1_LINK_PERMALINK.id}']`);
      await editBtn.trigger("click");
      await nextTick();

      // Confirm dialog is open
      expect(wrapper.find("[data-testid='permalink-edit-dialog']").exists()).toBe(true);

      // Set up the second fetch response
      const updatedGs1Permalink = {
        ...GS1_LINK_PERMALINK,
        baseUrl: "https://id2.example.com",
        updatedAt: "2026-01-02T00:00:00.000Z",
      };
      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [PRESENTATION_PERMALINK, updatedGs1Permalink],
        },
      });

      // Click the stub's "Emit Updated" button
      const emitUpdatedBtn = wrapper.find("[data-testid='stub-emit-updated']");
      expect(emitUpdatedBtn.exists()).toBe(true);
      await emitUpdatedBtn.trigger("click");
      await nextTick();
      await nextTick();

      // The list should have been re-fetched
      expect(listPermalinks.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
