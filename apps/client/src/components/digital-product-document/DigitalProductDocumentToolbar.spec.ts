/**
 * Slice 76 — DigitalProductDocumentToolbar
 *
 * (a) The toolbar's GS1/permalink/QR menu items now router.push to the org-scoped
 *     permalink list (?passportId=<id>) and the UPI list (?referenceId=<passportId>)
 *     INSTEAD of toggling local dialogs.
 * (b) PermalinkSettingsDialog, Gs1SettingsDialog, Gs1QrCodeDialog are no longer
 *     imported/rendered.
 * (c) The presentation PassportQrCodeDialog still opens via the SplitButton click.
 */

import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref } from "vue";
import { createI18n } from "vue-i18n";
import { DigitalProductDocumentStatusDto } from "@open-dpp/dto";
import type { DigitalProductDocumentDto } from "@open-dpp/dto";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { routerPush, routerReplace } = vi.hoisted(() => ({
  routerPush: vi.fn().mockResolvedValue(undefined),
  routerReplace: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({
    path: "/organizations/org-test/passports/passport-42",
    params: { organizationId: "org-test" },
    query: {},
  }),
  useRouter: () => ({ push: routerPush, replace: routerReplace }),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      passports: {
        publishById: vi.fn(),
        archiveById: vi.fn(),
        restoreById: vi.fn(),
        deleteById: vi.fn(),
        fetchById: vi.fn(),
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

vi.mock("primevue/usetoast", () => ({ useToast: () => ({ add: vi.fn() }) }));
vi.mock("primevue/useconfirm", () => ({ useConfirm: () => ({ require: vi.fn() }) }));

vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification: vi.fn() }),
}));

vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification: vi.fn() }),
}));

vi.mock("../../composables/digital-product-document", () => ({
  useDigitalProductDocument: () => ({
    publish: vi.fn(),
    archive: vi.fn(),
    restore: vi.fn(),
    deleteDPD: vi.fn(),
    fetchById: vi.fn(),
  }),
  DigitalProductDocumentType: { Passport: "passport", Template: "template" },
}));

vi.mock("../../composables/router-utils", () => ({
  useRouterUtils: () => ({ goToParent: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Component stubs
// ---------------------------------------------------------------------------

const ToolbarStub = defineComponent({
  name: "Toolbar",
  setup(_, { slots }) {
    return () =>
      h("div", { "data-testid": "toolbar-stub" }, [
        slots.start?.() ?? null,
        slots.center?.() ?? null,
        slots.end?.() ?? null,
      ]);
  },
});

const ButtonStub = defineComponent({
  name: "Button",
  inheritAttrs: false,
  props: ["label", "icon", "severity", "disabled", "variant"],
  emits: ["click"],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        "button",
        {
          "data-testid": attrs["data-testid"],
          "aria-label": attrs["aria-label"] ?? props.label,
          onClick: (e: Event) => emit("click", e),
          disabled: props.disabled,
        },
        props.label ?? props.icon ?? "",
      );
  },
});

const SplitButtonStub = defineComponent({
  name: "SplitButton",
  inheritAttrs: false,
  props: ["label", "icon", "model", "severity"],
  emits: ["click"],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        "div",
        { "data-testid": attrs["data-testid"] ?? "split-button-stub" },
        [
          h(
            "button",
            {
              "data-testid": "split-button-main-click",
              onClick: (e: Event) => emit("click", e),
            },
            props.label ?? "",
          ),
          ...(props.model ?? []).map(
            (item: { label: string; command?: () => void; disabled?: boolean }, idx: number) =>
              h(
                "button",
                {
                  key: idx,
                  "data-testid": `split-button-item-${idx}`,
                  "data-label": item.label,
                  onClick: () => item.command?.(),
                  disabled: item.disabled,
                },
                item.label,
              ),
          ),
        ],
      );
  },
});

const TagStub = defineComponent({
  name: "Tag",
  props: ["severity"],
  setup(_, { slots }) {
    return () => h("span", { class: "tag-stub" }, slots.default?.() ?? []);
  },
});

const PassportQrCodeDialogStub = defineComponent({
  name: "PassportQrCodeDialog",
  props: ["visible", "passportId", "status"],
  emits: ["update:visible", "publish"],
  setup(props) {
    return () =>
      props.visible
        ? h("div", { "data-testid": "passport-qrcode-dialog" })
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
        settings: { open: "Permalink settings" },
        list: { label: "Permalinks" },
      },
      gs1: {
        settings: { open: "GS1 settings" },
        qrCode: {
          open: "GS1 QR code",
          loadError: "Could not load GS1 identity.",
          title: "GS1 QR code",
        },
      },
      status: {
        draft: "Draft",
        published: "Published",
        archive: "Archive",
        restore: "Restore",
        publish: "Publish",
      },
      common: {
        remove: "Remove",
        qrCode: "QR code",
      },
      activityHistory: { label: "Activity history" },
      uniqueProductIdentifiers: { label: "Unique Product Identifiers" },
    },
  },
});

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const DRAFT_PASSPORT: DigitalProductDocumentDto = {
  id: "passport-42",
  name: "Test Passport",
  organizationId: "org-test",
  lastStatusChange: {
    currentStatus: DigitalProductDocumentStatusDto.Draft,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
} as unknown as DigitalProductDocumentDto;

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

import DigitalProductDocumentToolbar from "./DigitalProductDocumentToolbar.vue";

function mountToolbar(passport: DigitalProductDocumentDto = DRAFT_PASSPORT) {
  const model = ref(passport);
  return mount(DigitalProductDocumentToolbar, {
    props: {
      modelValue: model.value,
      type: "passport",
    },
    global: {
      plugins: [i18n, createPinia()],
      stubs: {
        Toolbar: ToolbarStub,
        Button: ButtonStub,
        SplitButton: SplitButtonStub,
        Tag: TagStub,
        PassportQrCodeDialog: PassportQrCodeDialogStub,
        // Explicitly stub out the three deleted dialogs to confirm they don't render
        PermalinkSettingsDialog: { template: '<div data-testid="old-permalink-settings-dialog"/>' },
        Gs1SettingsDialog: { template: '<div data-testid="old-gs1-settings-dialog"/>' },
        Gs1QrCodeDialog: { template: '<div data-testid="old-gs1-qrcode-dialog"/>' },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DigitalProductDocumentToolbar (Slice 76)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  describe("(a) Dropdown items push to the passport-scoped lists", () => {
    it("'Permalinks' menu item pushes to the passport permalink route", async () => {
      const wrapper = mountToolbar();

      // Find the SplitButton's menu item for permalinks (index 0)
      const permalinkItem = wrapper.find('[data-testid="split-button-item-0"]');
      expect(permalinkItem.exists()).toBe(true);
      expect(permalinkItem.attributes("data-label")).toBe("Permalinks");

      await permalinkItem.trigger("click");

      expect(routerPush).toHaveBeenCalledWith({
        name: "passportPermalinks",
        params: { organizationId: "org-test", passportId: "passport-42" },
      });
    });

    it("'Unique Product Identifiers' menu item pushes to the passport UPI route", async () => {
      const wrapper = mountToolbar();

      // Find the SplitButton's menu item for UPIs (index 1)
      const gs1Item = wrapper.find('[data-testid="split-button-item-1"]');
      expect(gs1Item.exists()).toBe(true);
      expect(gs1Item.attributes("data-label")).toBe("Unique Product Identifiers");

      await gs1Item.trigger("click");

      expect(routerPush).toHaveBeenCalledWith({
        name: "passportUniqueProductIdentifiers",
        params: { organizationId: "org-test", passportId: "passport-42" },
      });
    });
  });

  describe("(b) Legacy dialogs are NOT rendered", () => {
    it("PermalinkSettingsDialog is not rendered", () => {
      const wrapper = mountToolbar();
      // If the stubs are rendered, their data-testid would appear
      expect(wrapper.find('[data-testid="old-permalink-settings-dialog"]').exists()).toBe(false);
    });

    it("Gs1SettingsDialog is not rendered", () => {
      const wrapper = mountToolbar();
      expect(wrapper.find('[data-testid="old-gs1-settings-dialog"]').exists()).toBe(false);
    });

    it("Gs1QrCodeDialog is not rendered", () => {
      const wrapper = mountToolbar();
      expect(wrapper.find('[data-testid="old-gs1-qrcode-dialog"]').exists()).toBe(false);
    });
  });

  describe("(c) PassportQrCodeDialog still opens via SplitButton main click", () => {
    it("clicking the SplitButton's main action opens PassportQrCodeDialog", async () => {
      const wrapper = mountToolbar();

      expect(wrapper.find('[data-testid="passport-qrcode-dialog"]').exists()).toBe(false);

      const mainBtn = wrapper.find('[data-testid="split-button-main-click"]');
      expect(mainBtn.exists()).toBe(true);

      await mainBtn.trigger("click");

      expect(wrapper.find('[data-testid="passport-qrcode-dialog"]').exists()).toBe(true);
    });
  });
});
