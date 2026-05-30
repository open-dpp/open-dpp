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

// The dialog renders <Dialog>/<QrCode>/<Button> via unplugin-vue-components
// auto-import (no explicit import), so they must be stubbed by name.
const DialogStub = defineComponent({
  name: "Dialog",
  props: ["visible"],
  emits: ["update:visible"],
  setup(props, { slots }) {
    return () =>
      h("div", { class: "dialog-stub" }, [
        props.visible ? slots.default?.() : null,
        props.visible ? slots.footer?.() : null,
      ]);
  },
});

const ButtonStub = defineComponent({
  name: "Button",
  inheritAttrs: false,
  props: ["label", "disabled", "severity", "variant"],
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
        props.label,
      );
  },
});

const QrCodeStub = defineComponent({
  name: "QrCode",
  props: ["link", "size"],
  setup(props) {
    return () => h("div", { class: "qr-stub", "data-link": props.link });
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
      common: { copy: "Copy", close: "Close", clipboardSuccess: "Copied to clipboard." },
      gs1: {
        qrCode: {
          title: "GS1 QR code",
          digitalLink: { label: "GS1 Digital Link" },
          elementString: { label: "Element string" },
          empty: "No GS1 identity assigned yet.",
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import Gs1QrCodeDialog from "./Gs1QrCodeDialog.vue";
import type { Gs1IdentityResponse } from "@open-dpp/api-client";

const POPULATED: Gs1IdentityResponse = {
  uuid: "11111111-1111-1111-1111-111111111111",
  referenceId: "22222222-2222-2222-2222-222222222222",
  gtin: "04006381333931",
  batch: "LOT-42",
  serial: "SN-001",
  digitalLink: "https://id.example.com/01/04006381333931/10/LOT-42/21/SN-001",
};

const BARE: Gs1IdentityResponse = {
  uuid: "11111111-1111-1111-1111-111111111111",
  referenceId: "22222222-2222-2222-2222-222222222222",
  gtin: "04006381333931",
  digitalLink: "https://id.example.com/01/04006381333931",
};

function mountDialog(props: { identity?: Gs1IdentityResponse; visible?: boolean } = {}) {
  return mount(Gs1QrCodeDialog, {
    global: {
      plugins: [i18n],
      stubs: { Dialog: DialogStub, Button: ButtonStub, QrCode: QrCodeStub },
    },
    props: { visible: true, identity: undefined, ...props },
  });
}

describe("Gs1QrCodeDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the QR for the identity's Digital Link when populated", () => {
    const wrapper = mountDialog({ identity: POPULATED });
    const qr = wrapper.find(".qr-stub");
    expect(qr.exists()).toBe(true);
    expect(qr.attributes("data-link")).toBe(POPULATED.digitalLink);
  });

  it("shows the Digital Link URL when populated", () => {
    const wrapper = mountDialog({ identity: POPULATED });
    const link = wrapper.find("[data-testid='gs1-qr-digital-link']");
    expect(link.exists()).toBe(true);
    expect(link.text()).toContain(POPULATED.digitalLink);
    expect(link.attributes("href")).toBe(POPULATED.digitalLink);
  });

  it("shows the human-readable element string with all present AIs in canonical order", () => {
    const wrapper = mountDialog({ identity: POPULATED });
    const elementString = wrapper.find("[data-testid='gs1-qr-element-string']");
    expect(elementString.exists()).toBe(true);
    expect(elementString.text()).toBe("(01) 04006381333931 (10) LOT-42 (21) SN-001");
  });

  it("shows just the (01) element for a bare GTIN", () => {
    const wrapper = mountDialog({ identity: BARE });
    expect(wrapper.find("[data-testid='gs1-qr-element-string']").text()).toBe(
      "(01) 04006381333931",
    );
  });

  it("copies the Digital Link and notifies on the copy action", async () => {
    const wrapper = mountDialog({ identity: POPULATED });
    await wrapper.find("[data-testid='gs1-qr-copy-btn']").trigger("click");
    await nextTick();
    expect(copy).toHaveBeenCalledWith(POPULATED.digitalLink);
    expect(addSuccessNotification).toHaveBeenCalled();
  });

  it("renders the empty state and no QR when there is no GS1 identity", () => {
    const wrapper = mountDialog({ identity: undefined });
    expect(wrapper.find("[data-testid='gs1-qr-empty']").exists()).toBe(true);
    expect(wrapper.find(".qr-stub").exists()).toBe(false);
    expect(wrapper.find("[data-testid='gs1-qr-digital-link']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='gs1-qr-element-string']").exists()).toBe(false);
  });

  it("disables the copy action in the empty state", () => {
    const wrapper = mountDialog({ identity: undefined });
    const copyBtn = wrapper.find("[data-testid='gs1-qr-copy-btn']");
    expect(copyBtn.exists()).toBe(true);
    expect(copyBtn.attributes("disabled")).toBeDefined();
  });

  it("does not copy when there is no Digital Link", async () => {
    const wrapper = mountDialog({ identity: undefined });
    await wrapper.find("[data-testid='gs1-qr-copy-btn']").trigger("click");
    await nextTick();
    expect(copy).not.toHaveBeenCalled();
  });
});
