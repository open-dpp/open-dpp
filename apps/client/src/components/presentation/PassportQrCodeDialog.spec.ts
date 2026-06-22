import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { createI18n } from "vue-i18n";

// ---------------------------------------------------------------------------
// Mocks — must be declared before the component import so vi.mock hoisting
// picks them up. We expose the mock fn via vi.hoisted so tests can inspect
// individual calls.
// ---------------------------------------------------------------------------

const { getByPassport } = vi.hoisted(() => ({
  getByPassport: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      permalinks: {
        getByPassport,
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

// Stub out PrimeVue Dialog and other heavy UI deps to avoid missing plugin
// errors in jsdom. We only care about the data/logic layer.
vi.mock("primevue/dialog", () => ({
  default: defineComponent({
    name: "Dialog",
    props: ["visible"],
    emits: ["update:visible"],
    setup(props, { slots }) {
      return () => (props.visible ? h("div", slots.default?.() ?? []) : null);
    },
  }),
}));

vi.mock("primevue/usetoast", () => ({
  useToast: () => ({ add: vi.fn() }),
}));

vi.mock("@vueuse/core", () => ({
  useClipboard: () => ({ copy: vi.fn() }),
  useWindowSize: () => ({ width: ref(1024), height: ref(768) }),
}));

// Stub QrCode component
vi.mock("../../components/QrCode.vue", () => ({
  default: defineComponent({ name: "QrCode", template: "<div />" }),
}));

// Button stub — renders the label as text and forwards data-* attrs so we can
// find it by data-testid. We cannot rely on vi.mock("primevue/button") alone
// because the component is globally registered via unplugin-vue-components
// (not imported directly); it must be registered as a stub in mount options.
const ButtonStub = defineComponent({
  name: "Button",
  props: ["label", "icon", "severity", "ariaLabel", "title", "disabled", "variant", "size"],
  emits: ["click"],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        "button",
        {
          ...attrs,
          onClick: (e: Event) => emit("click", e),
        },
        props.label ?? "",
      );
  },
});

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const i18n = createI18n({
  locale: "en-US",
  legacy: false,
  messages: {
    en: {
      common: { copy: "Copy", presentationMode: "Presentation Mode", clipboardSuccess: "Copied" },
      permalink: { notfound: "No permalink" },
      qrCodeDialog: {
        draftWarning: "This passport is a draft and not yet publicly accessible.",
        archivedWarning: "This passport is archived and not publicly accessible.",
        publishAction: "Publish now",
      },
    },
  },
});

import PassportQrCodeDialog from "./PassportQrCodeDialog.vue";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PassportQrCodeDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does NOT call getByPassport while the dialog is closed (visible = false)", async () => {
    mount(PassportQrCodeDialog, {
      global: { plugins: [i18n] },
      props: { visible: false, passportId: "passport-1" },
    });
    await nextTick();
    expect(getByPassport).not.toHaveBeenCalled();
  });

  it("calls getByPassport with the passportId when visible becomes true", async () => {
    const visible = ref(false);

    const Harness = defineComponent({
      setup() {
        return { visible };
      },
      components: { PassportQrCodeDialog },
      template: `<PassportQrCodeDialog v-model:visible="visible" passportId="passport-42" />`,
    });

    mount(Harness, { global: { plugins: [i18n] } });
    await nextTick();
    expect(getByPassport).not.toHaveBeenCalled();

    // Simulate the user clicking the QR button in PassportListView → sets visible to true
    visible.value = true;
    await nextTick();

    expect(getByPassport).toHaveBeenCalledOnce();
    expect(getByPassport).toHaveBeenCalledWith("passport-42");
  });

  it("accepts the named v-model:visible binding (defineModel('visible') signature)", async () => {
    // This test mounts the dialog with `visible: true` via the named model
    // and asserts it renders — verifying that `defineModel('visible')` works
    // correctly and the consumer must use `v-model:visible`, NOT bare `v-model`.
    const wrapper = mount(PassportQrCodeDialog, {
      global: { plugins: [i18n] },
      props: { visible: true, passportId: "passport-7" },
    });
    await nextTick();
    // The Dialog stub renders its slot when visible=true
    expect(wrapper.html()).not.toBe("");
    expect(getByPassport).toHaveBeenCalledWith("passport-7");
  });

  describe("draft/archived warning banner", () => {
    const stubs = { Button: ButtonStub };

    it("shows a draft warning banner when status is Draft", async () => {
      const wrapper = mount(PassportQrCodeDialog, {
        global: { plugins: [i18n], stubs },
        props: { visible: true, passportId: "passport-draft", status: "Draft" },
      });
      await nextTick();
      expect(wrapper.text()).toContain("This passport is a draft and not yet publicly accessible.");
    });

    it("shows an archived warning banner when status is Archived", async () => {
      const wrapper = mount(PassportQrCodeDialog, {
        global: { plugins: [i18n], stubs },
        props: { visible: true, passportId: "passport-archived", status: "Archived" },
      });
      await nextTick();
      expect(wrapper.text()).toContain("This passport is archived and not publicly accessible.");
    });

    it("does NOT show a warning banner when status is Published", async () => {
      const wrapper = mount(PassportQrCodeDialog, {
        global: { plugins: [i18n], stubs },
        props: { visible: true, passportId: "passport-published", status: "Published" },
      });
      await nextTick();
      expect(wrapper.text()).not.toContain("This passport is a draft");
      expect(wrapper.text()).not.toContain("This passport is archived");
    });

    it("does NOT show a warning banner when status is undefined", async () => {
      const wrapper = mount(PassportQrCodeDialog, {
        global: { plugins: [i18n], stubs },
        props: { visible: true, passportId: "passport-no-status" },
      });
      await nextTick();
      expect(wrapper.text()).not.toContain("This passport is a draft");
      expect(wrapper.text()).not.toContain("This passport is archived");
    });

    it("shows a Publish button when status is Draft", async () => {
      const wrapper = mount(PassportQrCodeDialog, {
        global: { plugins: [i18n], stubs },
        props: { visible: true, passportId: "passport-draft", status: "Draft" },
      });
      await nextTick();
      expect(wrapper.text()).toContain("Publish now");
    });

    it("does NOT show a Publish button when status is Archived", async () => {
      const wrapper = mount(PassportQrCodeDialog, {
        global: { plugins: [i18n], stubs },
        props: { visible: true, passportId: "passport-archived", status: "Archived" },
      });
      await nextTick();
      expect(wrapper.text()).not.toContain("Publish now");
    });

    it("emits 'publish' when the Publish button is clicked (Draft status)", async () => {
      const wrapper = mount(PassportQrCodeDialog, {
        global: { plugins: [i18n], stubs },
        props: { visible: true, passportId: "passport-draft", status: "Draft" },
      });
      await nextTick();
      // Find the publish button by data-testid and click it
      const publishButton = wrapper.find("[data-testid='qr-publish-btn']");
      expect(publishButton.exists()).toBe(true);
      await publishButton.trigger("click");
      expect(wrapper.emitted("publish")).toBeTruthy();
      expect(wrapper.emitted("publish")).toHaveLength(1);
    });
  });
});
