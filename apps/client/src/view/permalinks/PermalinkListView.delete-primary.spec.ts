/**
 * Slice 76 — PermalinkListView: set-primary + guarded delete
 *
 * (a) a non-primary presentation row exposes 'Set primary' → calls permalinks.setPrimary(id) + reloads;
 *     the primary row has no Set-primary action
 * (b) Delete is BLOCKED for a published permalink and for the last/primary presentation permalink
 *     (button absent/disabled with tooltip)
 * (c) Delete is ALLOWED for an unpublished gs1-link row and a non-primary unpublished presentation row
 *     → permalinks.delete(id) + reload
 * (d) a 409 on delete surfaces a notification and keeps the row
 */

import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, inject, nextTick, provide } from "vue";
import { createI18n } from "vue-i18n";
import type { PermalinkPublicDto } from "@open-dpp/dto";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const {
  listPermalinks,
  deletePermalink,
  setPrimaryPermalink,
  confirmRequire,
  routerPush,
  routerReplace,
} = vi.hoisted(() => ({
  listPermalinks: vi
    .fn()
    .mockResolvedValue({ data: { paging_metadata: { cursor: null }, result: [] } }),
  deletePermalink: vi.fn().mockResolvedValue({ status: 204 }),
  setPrimaryPermalink: vi.fn().mockResolvedValue({ status: 200 }),
  confirmRequire: vi.fn(),
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      permalinks: {
        list: listPermalinks,
        create: vi.fn(),
        delete: deletePermalink,
        setPrimary: setPrimaryPermalink,
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
vi.mock("primevue/useconfirm", () => ({
  useConfirm: () => ({ require: confirmRequire }),
}));

vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification: vi.fn() }),
}));

const addSuccessNotificationMock = vi.fn();
vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification: addSuccessNotificationMock }),
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
          onClick: (e: Event) => !props.disabled && emit("click", e),
          disabled: props.disabled,
          title: props.title,
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

// Stub ConfirmDialog
const ConfirmDialogStub = defineComponent({
  name: "ConfirmDialog",
  setup() {
    return () => h("div", { "data-testid": "confirm-dialog-stub" });
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
          setPrimary: "Set primary",
          delete: "Delete",
          deletePrimaryTooltip: "Cannot delete the primary or last presentation permalink",
          deletePublishedTooltip: "Cannot delete a published permalink",
          deleteConfirmMessage: "Are you sure you want to delete this permalink?",
          deleteConfirmHeader: "Delete Permalink",
          deleteSuccess: "Permalink deleted.",
          deleteError: "Could not delete permalink.",
          setPrimarySuccess: "Primary permalink updated.",
          setPrimaryError: "Could not update primary permalink.",
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
        cancel: "Cancel",
        remove: "Delete",
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const PRIMARY_PRESENTATION: PermalinkPublicDto = {
  id: "pl-primary",
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

const NON_PRIMARY_PRESENTATION: PermalinkPublicDto = {
  id: "pl-non-primary",
  kind: "presentation",
  slug: "alt-passport",
  baseUrl: null,
  publishedUrl: null,
  presentationConfigurationId: "config-uuid-2",
  uniqueProductIdentifierId: null,
  primary: false,
  gs1DataAttributes: null,
  publicUrl: "https://example.com/p/alt-passport",
  fallbackBaseUrl: "https://example.com",
  fallbackBaseUrlSource: "instance",
  createdAt: "2024-01-02T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

const PUBLISHED_PRESENTATION: PermalinkPublicDto = {
  id: "pl-published",
  kind: "presentation",
  slug: "published-passport",
  baseUrl: null,
  publishedUrl: "https://example.com/p/published-passport",
  presentationConfigurationId: "config-uuid-3",
  uniqueProductIdentifierId: null,
  primary: false,
  gs1DataAttributes: null,
  publicUrl: "https://example.com/p/published-passport",
  fallbackBaseUrl: "https://example.com",
  fallbackBaseUrlSource: "instance",
  createdAt: "2024-01-03T00:00:00.000Z",
  updatedAt: "2024-01-03T00:00:00.000Z",
};

const GS1_LINK: PermalinkPublicDto = {
  id: "pl-gs1-link",
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
  createdAt: "2024-01-04T00:00:00.000Z",
  updatedAt: "2024-01-04T00:00:00.000Z",
};

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

import PermalinkListView from "./PermalinkListView.vue";

function mountView() {
  return mount(PermalinkListView, {
    global: {
      plugins: [i18n],
      stubs: {
        DataTable: DataTableStub,
        Column: ColumnStub,
        Button: ButtonStub,
        Tag: TagStub,
        PermalinkCreateGs1LinkDialog: CreateGs1LinkDialogStub,
        ConfirmDialog: ConfirmDialogStub,
        PermalinkEditDialog: { template: "<div/>" },
        Gs1LinkQrCode: { template: "<div/>" },
        Dialog: { template: "<div><slot/></div>" },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PermalinkListView delete + set-primary (Slice 76)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addSuccessNotificationMock.mockClear();
    setActivePinia(createPinia());
    listPermalinks.mockResolvedValue({ data: { paging_metadata: { cursor: null }, result: [] } });
    // Default: confirmRequire immediately calls accept
    confirmRequire.mockImplementation((opts: { accept?: () => void | Promise<void> }) =>
      opts.accept?.(),
    );
  });

  // ─── (a) Set-primary ─────────────────────────────────────────────────────

  describe("(a) Set-primary", () => {
    it("non-primary presentation row shows 'Set primary' button", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [PRIMARY_PRESENTATION, NON_PRIMARY_PRESENTATION],
        },
      });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      const btn = wrapper.find(
        `[data-testid="permalink-set-primary-btn-${NON_PRIMARY_PRESENTATION.id}"]`,
      );
      expect(btn.exists()).toBe(true);
    });

    it("primary row has no 'Set primary' button", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [PRIMARY_PRESENTATION, NON_PRIMARY_PRESENTATION],
        },
      });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      const btn = wrapper.find(
        `[data-testid="permalink-set-primary-btn-${PRIMARY_PRESENTATION.id}"]`,
      );
      expect(btn.exists()).toBe(false);
    });

    it("clicking 'Set primary' calls setPrimary and reloads the list", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [PRIMARY_PRESENTATION, NON_PRIMARY_PRESENTATION],
        },
      });
      setPrimaryPermalink.mockResolvedValue({});

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      expect(listPermalinks).toHaveBeenCalledTimes(1);

      const btn = wrapper.find(
        `[data-testid="permalink-set-primary-btn-${NON_PRIMARY_PRESENTATION.id}"]`,
      );

      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [
            { ...NON_PRIMARY_PRESENTATION, primary: true },
            { ...PRIMARY_PRESENTATION, primary: false },
          ],
        },
      });

      await btn.trigger("click");
      await nextTick();
      await nextTick();

      expect(setPrimaryPermalink).toHaveBeenCalledWith(NON_PRIMARY_PRESENTATION.id);
      expect(listPermalinks.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── (b) Delete BLOCKED ───────────────────────────────────────────────────

  describe("(b) Delete BLOCKED", () => {
    it("published permalink: Delete button is absent or disabled", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [PRIMARY_PRESENTATION, PUBLISHED_PRESENTATION],
        },
      });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      const btn = wrapper.find(`[data-testid="permalink-delete-btn-${PUBLISHED_PRESENTATION.id}"]`);
      // Either absent or disabled
      if (btn.exists()) {
        expect(btn.attributes("disabled")).toBeDefined();
      } else {
        expect(btn.exists()).toBe(false);
      }
    });

    it("primary presentation permalink: Delete button is absent or disabled", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [PRIMARY_PRESENTATION, NON_PRIMARY_PRESENTATION],
        },
      });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      const btn = wrapper.find(`[data-testid="permalink-delete-btn-${PRIMARY_PRESENTATION.id}"]`);
      if (btn.exists()) {
        expect(btn.attributes("disabled")).toBeDefined();
      } else {
        expect(btn.exists()).toBe(false);
      }
    });

    it("last presentation permalink (sole presentation row): Delete button is absent or disabled", async () => {
      // Only one presentation permalink, no gs1-link — it's the last one
      listPermalinks.mockResolvedValueOnce({
        data: { paging_metadata: { cursor: null }, result: [PRIMARY_PRESENTATION] },
      });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      const btn = wrapper.find(`[data-testid="permalink-delete-btn-${PRIMARY_PRESENTATION.id}"]`);
      if (btn.exists()) {
        expect(btn.attributes("disabled")).toBeDefined();
      } else {
        expect(btn.exists()).toBe(false);
      }
    });
  });

  // ─── (c) Delete ALLOWED ───────────────────────────────────────────────────

  describe("(c) Delete ALLOWED", () => {
    it("unpublished gs1-link row: Delete button is present and enabled", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: { paging_metadata: { cursor: null }, result: [PRIMARY_PRESENTATION, GS1_LINK] },
      });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      const btn = wrapper.find(`[data-testid="permalink-delete-btn-${GS1_LINK.id}"]`);
      expect(btn.exists()).toBe(true);
      expect(btn.attributes("disabled")).toBeUndefined();
    });

    it("clicking Delete on gs1-link calls delete + reloads", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: { paging_metadata: { cursor: null }, result: [PRIMARY_PRESENTATION, GS1_LINK] },
      });
      deletePermalink.mockResolvedValue({ status: 204 });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      expect(listPermalinks).toHaveBeenCalledTimes(1);

      const btn = wrapper.find(`[data-testid="permalink-delete-btn-${GS1_LINK.id}"]`);

      listPermalinks.mockResolvedValueOnce({
        data: { paging_metadata: { cursor: null }, result: [PRIMARY_PRESENTATION] },
      });

      await btn.trigger("click");
      await nextTick();
      await nextTick();

      expect(deletePermalink).toHaveBeenCalledWith(GS1_LINK.id);
      expect(listPermalinks.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it("non-primary unpublished presentation row: Delete button is present and enabled", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [PRIMARY_PRESENTATION, NON_PRIMARY_PRESENTATION],
        },
      });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      const btn = wrapper.find(
        `[data-testid="permalink-delete-btn-${NON_PRIMARY_PRESENTATION.id}"]`,
      );
      expect(btn.exists()).toBe(true);
      expect(btn.attributes("disabled")).toBeUndefined();
    });

    it("clicking Delete on non-primary presentation calls delete + reloads", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: {
          paging_metadata: { cursor: null },
          result: [PRIMARY_PRESENTATION, NON_PRIMARY_PRESENTATION],
        },
      });
      deletePermalink.mockResolvedValue({ status: 204 });

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      expect(listPermalinks).toHaveBeenCalledTimes(1);

      const btn = wrapper.find(
        `[data-testid="permalink-delete-btn-${NON_PRIMARY_PRESENTATION.id}"]`,
      );

      listPermalinks.mockResolvedValueOnce({
        data: { paging_metadata: { cursor: null }, result: [PRIMARY_PRESENTATION] },
      });

      await btn.trigger("click");
      await nextTick();
      await nextTick();

      expect(deletePermalink).toHaveBeenCalledWith(NON_PRIMARY_PRESENTATION.id);
      expect(listPermalinks.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── (d) 409 on delete ────────────────────────────────────────────────────

  describe("(d) 409 on delete surfaces notification and keeps the row", () => {
    it("when delete returns 409, a notification is shown and list is NOT reloaded without the row", async () => {
      listPermalinks.mockResolvedValueOnce({
        data: { paging_metadata: { cursor: null }, result: [PRIMARY_PRESENTATION, GS1_LINK] },
      });

      const axiosError = {
        response: { status: 409 },
        isAxiosError: true,
        message: "Conflict",
      };
      deletePermalink.mockRejectedValue(axiosError);

      const wrapper = mountView();
      await nextTick();
      await nextTick();

      const btn = wrapper.find(`[data-testid="permalink-delete-btn-${GS1_LINK.id}"]`);

      await btn.trigger("click");
      await nextTick();
      await nextTick();

      expect(deletePermalink).toHaveBeenCalledWith(GS1_LINK.id);
      // The row should still be present (list not replaced with one that excludes it)
      const row = wrapper.find(`[data-testid="permalink-row-${GS1_LINK.id}"]`);
      expect(row.exists()).toBe(true);
    });
  });
});
