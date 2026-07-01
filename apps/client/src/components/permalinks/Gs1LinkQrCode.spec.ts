import { permalinkPublicPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { copy } = vi.hoisted(() => ({ copy: vi.fn() }));
vi.mock("@vueuse/core", async () => {
  const actual = await vi.importActual<typeof import("@vueuse/core")>("@vueuse/core");
  return {
    ...actual,
    useClipboard: () => ({ copy }),
  };
});

const addSuccessNotification = vi.fn();
vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification }),
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

// ---------------------------------------------------------------------------
// Component stubs
// ---------------------------------------------------------------------------

const QrCodeStub = defineComponent({
  name: "QrCode",
  props: ["link", "size"],
  setup(props) {
    return () => h("div", { class: "qr-stub", "data-link": props.link });
  },
});

const ButtonStub = defineComponent({
  name: "Button",
  inheritAttrs: false,
  props: ["label", "disabled", "severity", "variant", "icon", "size"],
  emits: ["click"],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        "button",
        {
          onClick: () => emit("click"),
          disabled: props.disabled,
          "data-testid": attrs["data-testid"],
        },
        props.label ?? props.icon,
      );
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
      common: {
        copy: "Copy",
        clipboardSuccess: "Copied to clipboard.",
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
// Import after mocks
// ---------------------------------------------------------------------------

import Gs1LinkQrCode from "./Gs1LinkQrCode.vue";
import type { PermalinkPublicDto } from "@open-dpp/api-client";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const FULL_DIGITAL_LINK = "https://id.example.com/01/04006381333931/10/LOT-42/21/SN-001?17=251231";

// gs1-link permalink: the component derives the QR data-link and copy target
// from `publicUrl`, and gates on `kind === gs1-link`. Override those asserted
// fields; the rest come from the factory's gs1 transient defaults.
const GS1_PERMALINK: PermalinkPublicDto = permalinkPublicPlainFactory.build(
  {
    publicUrl: FULL_DIGITAL_LINK,
    gs1DataAttributes: { "17": "251231" },
  },
  { transient: { gs1: true } },
);

// presentation permalink: the component only checks that kind !== gs1-link to
// render the empty state, which is exactly the factory's default kind.
const PRESENTATION_PERMALINK: PermalinkPublicDto = permalinkPublicPlainFactory.build();

const UPI_IDENTITY = {
  gtin: "04006381333931",
  batch: "LOT-42",
  serial: "SN-001",
};

function mountComponent(props: {
  permalink: PermalinkPublicDto;
  identity?: { gtin: string; batch?: string | null; serial?: string | null } | null;
}) {
  return mount(Gs1LinkQrCode, {
    global: {
      plugins: [i18n],
      stubs: { QrCode: QrCodeStub, Button: ButtonStub },
    },
    props,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Gs1LinkQrCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("(a) QrCode receives data-link equal to the full GS1 Digital Link", () => {
    const wrapper = mountComponent({ permalink: GS1_PERMALINK, identity: UPI_IDENTITY });
    const qr = wrapper.find(".qr-stub");
    expect(qr.exists()).toBe(true);
    expect(qr.attributes("data-link")).toBe(FULL_DIGITAL_LINK);
  });

  it("(b) human-readable element string shows (01)…(10)…(21)… via formatGs1ElementString", () => {
    const wrapper = mountComponent({ permalink: GS1_PERMALINK, identity: UPI_IDENTITY });
    const elementString = wrapper.find("[data-testid='gs1-link-qr-element-string']");
    expect(elementString.exists()).toBe(true);
    expect(elementString.text()).toBe("(01) 04006381333931 (10) LOT-42 (21) SN-001");
  });

  it("(c) copy button copies the full digital link and notifies", async () => {
    const wrapper = mountComponent({ permalink: GS1_PERMALINK, identity: UPI_IDENTITY });
    await wrapper.find("[data-testid='gs1-link-qr-copy-btn']").trigger("click");
    await nextTick();
    expect(copy).toHaveBeenCalledWith(FULL_DIGITAL_LINK);
    expect(addSuccessNotification).toHaveBeenCalled();
  });

  it("(d) presentation-only permalink renders the empty/N-A state with no QR", () => {
    const wrapper = mountComponent({ permalink: PRESENTATION_PERMALINK });
    expect(wrapper.find("[data-testid='gs1-link-qr-empty']").exists()).toBe(true);
    expect(wrapper.find(".qr-stub").exists()).toBe(false);
    expect(wrapper.find("[data-testid='gs1-link-qr-element-string']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='gs1-link-qr-copy-btn']").exists()).toBe(false);
  });
});
