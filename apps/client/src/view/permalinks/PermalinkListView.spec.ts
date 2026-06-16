/**
 * Slice 74 — PermalinkListView
 *
 * Failing tests first (RED), then the component is implemented (GREEN).
 *
 * Mirror PassportListView.spec pattern:
 * - mock api-client/const/router/stores
 * - stub DataTable + Column + Button
 * - `permalinks.list` returns a presentation permalink (primary) + a gs1-link permalink
 * - Assert:
 *   (a) both rows render
 *   (b) a kind indicator ('Presentation' vs 'GS1 Digital Link') + a Primary badge on the primary row
 *   (c) the public URL is shown/linkable
 *   (d) a 'Create GS1 link' header action toggles the create dialog
 *   (e) the list re-fetches after `created`
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

const { listPermalinks, createPermalink, routerPush, routerReplace } = vi.hoisted(() => ({
  listPermalinks: vi.fn().mockResolvedValue({ data: { paging_metadata: { cursor: null }, result: [] } }),
  createPermalink: vi.fn(),
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      permalinks: {
        list: listPermalinks,
        create: createPermalink,
      },
      passports: {
        getPermalinks: listPermalinks,
      },
      uniqueProductIdentifiers: {
        list: vi.fn().mockResolvedValue({ data: { paging_metadata: { cursor: null }, result: [] } }),
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
                    { "data-testid": `permalink-row-${item.kind}` },
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
  setup(props, { emit }) {
    return () =>
      props.visible
        ? h("div", { "data-testid": "permalink-create-gs1-dialog" }, [
            h(
              "button",
              {
                "data-testid": "stub-emit-created",
                onClick: () =>
                  emit("created", {
                    id: "new-pl-id",
                    kind: "gs1-link",
                    slug: null,
                    baseUrl: null,
                    publishedUrl: null,
                    presentationConfigurationId: null,
                    uniqueProductIdentifierId: "upi-uuid-123",
                    primary: false,
                    gs1ResolverBase: null,
                    gs1DataAttributes: null,
                    publicUrl: "https://example.com/gs1/new",
                    fallbackBaseUrl: "https://example.com",
                    fallbackBaseUrlSource: "instance",
                    createdAt: "2024-01-01T00:00:00.000Z",
                    updatedAt: "2024-01-01T00:00:00.000Z",
                  } as PermalinkPublicDto),
              },
              "Emit Created",
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
        },
        createGs1Link: {
          title: "Create GS1 Digital Link",
          selectUpi: "Select UPI",
          upiAlreadyLinked: "This UPI already has a GS1 Digital Link permalink.",
          gs1ResolverBase: {
            label: "GS1 Resolver Base URL (optional)",
            placeholder: "e.g. https://id.example.com",
          },
          gs1DataAttributes: "GS1 Data Attributes (optional)",
          conflict: "A GS1 Digital Link permalink for this UPI already exists.",
          submit: "Create",
        },
      },
      common: {
        add: "Add",
        edit: "Edit",
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
  gs1ResolverBase: null,
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
  gs1ResolverBase: "https://id.example.com",
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
  return mount(PermalinkListView, {
    global: {
      plugins: [i18n],
      stubs: {
        DataTable: DataTableStub,
        Column: ColumnStub,
        Button: ButtonStub,
        Tag: TagStub,
        PermalinkCreateGs1LinkDialog: CreateGs1LinkDialogStub,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PermalinkListView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    listPermalinks.mockResolvedValue({ data: { paging_metadata: { cursor: null }, result: [] } });
  });

  it("(a) both rows render (presentation + gs1-link)", async () => {
    listPermalinks.mockResolvedValueOnce({
      data: { paging_metadata: { cursor: null }, result: [PRESENTATION_PERMALINK, GS1_LINK_PERMALINK] },
    });

    const wrapper = mountView();
    await nextTick();
    await nextTick();

    expect(listPermalinks).toHaveBeenCalledTimes(1);

    const presentationRow = wrapper.find("[data-testid='permalink-row-presentation']");
    const gs1Row = wrapper.find("[data-testid='permalink-row-gs1-link']");

    expect(presentationRow.exists()).toBe(true);
    expect(gs1Row.exists()).toBe(true);
  });

  it("(b) kind indicator and Primary badge on the primary row", async () => {
    listPermalinks.mockResolvedValueOnce({
      data: { paging_metadata: { cursor: null }, result: [PRESENTATION_PERMALINK, GS1_LINK_PERMALINK] },
    });

    const wrapper = mountView();
    await nextTick();
    await nextTick();

    // Presentation row has a kind label showing "Presentation"
    const presentationRow = wrapper.find("[data-testid='permalink-row-presentation']");
    expect(presentationRow.text()).toContain("Presentation");

    // GS1 row has "GS1 Digital Link" kind label
    const gs1Row = wrapper.find("[data-testid='permalink-row-gs1-link']");
    expect(gs1Row.text()).toContain("GS1 Digital Link");

    // Primary badge appears on the primary row (the presentation one)
    const primaryBadge = wrapper.find("[data-testid='permalink-primary-badge-pl-presentation-1']");
    expect(primaryBadge.exists()).toBe(true);

    // No primary badge on the gs1-link row
    const gs1PrimaryBadge = wrapper.find("[data-testid='permalink-primary-badge-pl-gs1-1']");
    expect(gs1PrimaryBadge.exists()).toBe(false);
  });

  it("(c) public URL is shown", async () => {
    listPermalinks.mockResolvedValueOnce({
      data: { paging_metadata: { cursor: null }, result: [PRESENTATION_PERMALINK, GS1_LINK_PERMALINK] },
    });

    const wrapper = mountView();
    await nextTick();
    await nextTick();

    // Presentation permalink's public URL should appear
    const presentationRow = wrapper.find("[data-testid='permalink-row-presentation']");
    expect(presentationRow.text()).toContain("https://example.com/p/my-passport");

    // GS1 permalink's public URL should appear
    const gs1Row = wrapper.find("[data-testid='permalink-row-gs1-link']");
    expect(gs1Row.text()).toContain("https://id.example.com/01/04006381333931");
  });

  it("(d) 'Create GS1 link' header action toggles the create dialog", async () => {
    const wrapper = mountView();
    await nextTick();
    await nextTick();

    // Initially the dialog should not be visible
    expect(wrapper.find("[data-testid='permalink-create-gs1-dialog']").exists()).toBe(false);

    // Click the "Create GS1 link" button
    const createBtn = wrapper.find("[data-testid='permalink-create-gs1-link-btn']");
    expect(createBtn.exists()).toBe(true);

    await createBtn.trigger("click");
    await nextTick();

    // The dialog should now be visible
    expect(wrapper.find("[data-testid='permalink-create-gs1-dialog']").exists()).toBe(true);
  });

  it("(e) the list re-fetches after create dialog emits 'created'", async () => {
    listPermalinks.mockResolvedValueOnce({
      data: { paging_metadata: { cursor: null }, result: [PRESENTATION_PERMALINK] },
    });

    const wrapper = mountView();
    await nextTick();
    await nextTick();

    expect(listPermalinks).toHaveBeenCalledTimes(1);

    // Open the create dialog
    const createBtn = wrapper.find("[data-testid='permalink-create-gs1-link-btn']");
    await createBtn.trigger("click");
    await nextTick();

    // Emit created
    const stubBtn = wrapper.find("[data-testid='stub-emit-created']");
    expect(stubBtn.exists()).toBe(true);

    listPermalinks.mockResolvedValueOnce({
      data: { paging_metadata: { cursor: null }, result: [PRESENTATION_PERMALINK, GS1_LINK_PERMALINK] },
    });

    await stubBtn.trigger("click");
    await nextTick();
    await nextTick();

    // The list should have been re-fetched
    expect(listPermalinks.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
