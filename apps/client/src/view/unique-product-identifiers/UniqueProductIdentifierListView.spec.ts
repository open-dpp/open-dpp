/**
 * Tests for UniqueProductIdentifierListView
 *
 * Slice 67 — org-scoped table; system read-only; create → GS1 link prompt
 */

import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";
import type { UniqueProductIdentifierListItemDto } from "@open-dpp/dto";
import { uniqueProductIdentifierPlainFactory } from "@open-dpp/testing";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { listUpis, routerPush, routerReplace } = vi.hoisted(() => ({
  listUpis: vi.fn().mockResolvedValue({
    data: { paging_metadata: { cursor: null }, result: [] },
  }),
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      uniqueProductIdentifiers: {
        list: listUpis,
        create: vi.fn(),
        delete: vi.fn(),
      },
      passports: {
        getAll: vi.fn().mockResolvedValue({
          data: { paging_metadata: { cursor: null }, result: [] },
        }),
        getById: vi.fn().mockResolvedValue({
          data: { lastStatusChange: { currentStatus: "Draft", previousStatus: null } },
        }),
        getUniqueProductIdentifiers: listUpis,
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
  useRoute: () => ({
    query: {},
    path: "/organizations/org-1/passports/p-1/unique-product-identifiers",
    params: { passportId: "p-1", organizationId: "org-1" },
  }),
  useRouter: () => ({ push: routerPush, replace: routerReplace }),
}));

vi.mock("primevue/usetoast", () => ({ useToast: () => ({ add: vi.fn() }) }));
vi.mock("primevue/useconfirm", () => ({ useConfirm: () => ({ require: vi.fn() }) }));

vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Component stubs
// ---------------------------------------------------------------------------

/**
 * DataTable stub that renders rows and passes each row's data to Column children
 * via provide/inject so that Column body slots receive the correct data.
 */
import { inject, provide } from "vue";

const ROW_DATA_KEY = Symbol("rowData");

const DataTableStub = defineComponent({
  name: "DataTable",
  props: ["value", "loading"],
  setup(props, { slots }) {
    return () =>
      h("div", { "data-testid": "upi-data-table" }, [
        slots.header?.() ?? null,
        ...(props.value ?? []).map((item: UniqueProductIdentifierListItemDto) =>
          h(
            {
              // Anonymous wrapper that provides row data to Column children
              setup(_: unknown, { slots: innerSlots }: { slots: Record<string, unknown> }) {
                provide(ROW_DATA_KEY, item);
                return () =>
                  h(
                    "div",
                    {
                      "data-testid": `upi-row-${item.type === "OPEN_DPP_UUID" ? "system" : "gs1"}`,
                    },
                    [
                      h("span", { "data-testid": "upi-row-type" }, item.type),
                      h("span", { "data-testid": "upi-row-gtin" }, item.gtin ?? ""),
                      // Render all default slot content (i.e. the Columns)
                      ...(typeof innerSlots.default === "function" ? innerSlots.default() : []),
                    ],
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
    const rowData = inject<UniqueProductIdentifierListItemDto | undefined>(ROW_DATA_KEY, undefined);
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

// Stub UniqueProductIdentifierCreateDialog: captures emitted events for testing
const createDialogVisible = ref(false);
const CreateDialogStub = defineComponent({
  name: "UniqueProductIdentifierCreateDialog",
  props: ["visible", "passportId", "isDraft", "createGs1Upi"],
  emits: ["update:visible", "created"],
  setup(_, { emit }) {
    return () =>
      h("div", { "data-testid": "upi-create-dialog" }, [
        h(
          "button",
          {
            "data-testid": "stub-emit-created",
            onClick: () =>
              emit("created", {
                uuid: "new-upi-uuid",
                referenceId: "ref-123",
                type: "GS1",
                gtin: "04006381333931",
                batch: null,
                serial: null,
                granularity: "model",
                digitalLink: null,
                passportPublished: false,
              } as UniqueProductIdentifierListItemDto),
          },
          "Emit Created",
        ),
      ]);
  },
});

// Stub Gs1DigitalLinkPromptDialog
const PromptDialogStub = defineComponent({
  name: "Gs1DigitalLinkPromptDialog",
  props: ["visible", "upi"],
  emits: ["update:visible", "addLink", "skip"],
  setup(props, { emit }) {
    return () =>
      props.visible
        ? h("div", { "data-testid": "gs1-link-prompt-dialog" }, [
            h("span", { "data-testid": "gs1-link-prompt-upi-uuid" }, props.upi?.uuid ?? ""),
            h(
              "button",
              {
                "data-testid": "gs1-link-prompt-add",
                onClick: () => emit("addLink", props.upi),
              },
              "Add Link",
            ),
            h(
              "button",
              {
                "data-testid": "gs1-link-prompt-skip",
                onClick: () => emit("skip"),
              },
              "Skip",
            ),
          ])
        : null;
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
      uniqueProductIdentifiers: {
        label: "Unique Product Identifier | Unique Product Identifiers",
        list: {
          type: "Type",
          gtin: "GTIN",
          batch: "Batch / Lot",
          serial: "Serial",
          reference: "Passport",
          systemReadOnly: "System (read-only)",
          empty: "No unique product identifiers found.",
        },
        create: {
          title: "Create GS1 Unique Product Identifier",
        },
      },
      common: {
        add: "Add",
        delete: "Delete",
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const SYSTEM_UPI: UniqueProductIdentifierListItemDto = uniqueProductIdentifierPlainFactory.build({
  uuid: "system-upi-uuid",
  referenceId: "ref-111",
});

const GS1_UPI: UniqueProductIdentifierListItemDto = uniqueProductIdentifierPlainFactory.build(
  {
    uuid: "gs1-upi-uuid",
    referenceId: "ref-222",
    gtin: "04006381333931",
    batch: "LOT-42",
    serial: "SN-001",
    granularity: "item",
    digitalLink: "https://id.example.com/01/04006381333931/10/LOT-42/21/SN-001",
  },
  { transient: { gs1: true } },
);

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

import UniqueProductIdentifierListView from "./UniqueProductIdentifierListView.vue";

function mountView() {
  return mount(UniqueProductIdentifierListView, {
    global: {
      plugins: [i18n],
      stubs: {
        DataTable: DataTableStub,
        Column: ColumnStub,
        Button: ButtonStub,
        UniqueProductIdentifierCreateDialog: CreateDialogStub,
        Gs1DigitalLinkPromptDialog: PromptDialogStub,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UniqueProductIdentifierListView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    createDialogVisible.value = false;
    listUpis.mockResolvedValue({
      data: { paging_metadata: { cursor: null }, result: [] },
    });
  });

  it("(5) pagination: list fires once on mount; rows match result length", async () => {
    listUpis.mockResolvedValueOnce({
      data: { paging_metadata: { cursor: null }, result: [SYSTEM_UPI, GS1_UPI] },
    });

    const wrapper = mountView();
    await nextTick();
    await nextTick();

    expect(listUpis).toHaveBeenCalledTimes(1);
    const rows = wrapper.findAll("[data-testid='upi-row-system'], [data-testid='upi-row-gs1']");
    expect(rows).toHaveLength(2);
  });

  it("(1) renders one row per UPI with type and gtin", async () => {
    listUpis.mockResolvedValueOnce({
      data: { paging_metadata: { cursor: null }, result: [SYSTEM_UPI, GS1_UPI] },
    });

    const wrapper = mountView();
    await nextTick();
    await nextTick();

    const systemRow = wrapper.find("[data-testid='upi-row-system']");
    const gs1Row = wrapper.find("[data-testid='upi-row-gs1']");

    expect(systemRow.exists()).toBe(true);
    expect(gs1Row.exists()).toBe(true);

    // Check that the GS1 row shows GTIN
    expect(gs1Row.find("[data-testid='upi-row-gtin']").text()).toBe("04006381333931");
  });

  it("(2a) internal (OPEN_DPP_UUID) row renders a delete action — deletable (ADR 0006)", async () => {
    listUpis.mockResolvedValueOnce({
      data: { paging_metadata: { cursor: null }, result: [SYSTEM_UPI] },
    });

    const wrapper = mountView();
    await nextTick();
    await nextTick();

    const systemRow = wrapper.find("[data-testid='upi-row-system']");
    expect(systemRow.exists()).toBe(true);
    expect(systemRow.find("[data-testid='upi-delete-btn']").exists()).toBe(true);
  });

  it("(2b) GS1 row renders a delete action (upi-delete-btn)", async () => {
    listUpis.mockResolvedValueOnce({
      data: { paging_metadata: { cursor: null }, result: [GS1_UPI] },
    });

    const wrapper = mountView();
    await nextTick();
    await nextTick();

    const gs1Row = wrapper.find("[data-testid='upi-row-gs1']");
    expect(gs1Row.exists()).toBe(true);
    expect(gs1Row.find("[data-testid='upi-delete-btn']").exists()).toBe(true);
  });

  it("(3) header Add button opens the create dialog", async () => {
    const wrapper = mountView();
    await nextTick();
    await nextTick();

    // Initially the create dialog stub is rendered but may not be visible
    const addButton = wrapper.find("[data-testid='upi-add-btn']");
    expect(addButton.exists()).toBe(true);

    await addButton.trigger("click");
    await flushPromises();
    await nextTick();

    // After clicking Add, the create dialog should be visible
    const createDialog = wrapper.find("[data-testid='upi-create-dialog']");
    expect(createDialog.exists()).toBe(true);
  });

  it("(4a) after create dialog emits 'created', Gs1DigitalLinkPromptDialog is visible with the new UPI", async () => {
    const wrapper = mountView();
    await nextTick();
    await nextTick();

    // Open the create dialog first
    const addButton = wrapper.find("[data-testid='upi-add-btn']");
    await addButton.trigger("click");
    await flushPromises();
    await nextTick();

    // Emit 'created' from the create dialog stub
    const stubBtn = wrapper.find("[data-testid='stub-emit-created']");
    expect(stubBtn.exists()).toBe(true);
    await stubBtn.trigger("click");
    await nextTick();

    // Prompt dialog should now be visible
    const promptDialog = wrapper.find("[data-testid='gs1-link-prompt-dialog']");
    expect(promptDialog.exists()).toBe(true);

    // It should have the new UPI's uuid
    expect(promptDialog.find("[data-testid='gs1-link-prompt-upi-uuid']").text()).toBe(
      "new-upi-uuid",
    );
  });

  it("(4b) prompt dialog @addLink -> router.push to this passport's permalink list", async () => {
    const wrapper = mountView();
    await nextTick();
    await nextTick();

    // Open create dialog
    await wrapper.find("[data-testid='upi-add-btn']").trigger("click");
    await flushPromises();
    await nextTick();

    // Emit created
    await wrapper.find("[data-testid='stub-emit-created']").trigger("click");
    await nextTick();

    // Click addLink in prompt dialog
    const addLinkBtn = wrapper.find("[data-testid='gs1-link-prompt-add']");
    expect(addLinkBtn.exists()).toBe(true);
    await addLinkBtn.trigger("click");
    await nextTick();

    // router.push should target the passport-scoped permalink route for THIS passport
    expect(routerPush).toHaveBeenCalledOnce();
    const pushArg = routerPush.mock.calls[0]![0];
    expect(pushArg).toMatchObject({
      name: "passportPermalinks",
      params: { organizationId: "org-1", passportId: "p-1" },
    });
  });

  it("(4c) prompt dialog @skip -> closes the prompt and reloads", async () => {
    const wrapper = mountView();
    await nextTick();
    await nextTick();

    // Open create dialog
    await wrapper.find("[data-testid='upi-add-btn']").trigger("click");
    await flushPromises();
    await nextTick();

    // Emit created
    await wrapper.find("[data-testid='stub-emit-created']").trigger("click");
    await nextTick();

    // Click skip
    const skipBtn = wrapper.find("[data-testid='gs1-link-prompt-skip']");
    expect(skipBtn.exists()).toBe(true);
    await skipBtn.trigger("click");
    await nextTick();

    // Prompt dialog should be gone
    expect(wrapper.find("[data-testid='gs1-link-prompt-dialog']").exists()).toBe(false);

    // list should have been called again (reload)
    expect(listUpis.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
