import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { getGs1Identity, setGs1Identity, deleteGs1Identity } = vi.hoisted(() => ({
  getGs1Identity: vi.fn(),
  setGs1Identity: vi.fn(),
  deleteGs1Identity: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      passports: {
        getGs1Identity,
        setGs1Identity,
        deleteGs1Identity,
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

const logErrorWithNotification = vi.fn();
const addSuccessNotification = vi.fn();
vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification }),
}));
vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification }),
}));

// The component renders <Dialog> via unplugin-vue-components auto-import (no
// explicit import), so a module mock won't intercept it — stub it by name in the
// mount `stubs` option instead (see DialogStub below).
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

const InputTextStub = defineComponent({
  name: "InputText",
  props: ["modelValue", "disabled", "invalid", "placeholder", "id"],
  emits: ["update:modelValue"],
  template: `<input :value="modelValue" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)" />`,
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

const MessageStub = defineComponent({
  name: "Message",
  inheritAttrs: false,
  props: ["severity", "closable"],
  setup(_props, { slots, attrs }) {
    return () =>
      h("div", { class: "message-stub", "data-testid": attrs["data-testid"] }, slots.default?.());
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
      common: { cancel: "Cancel", save: "Save", remove: "Remove" },
      gs1: {
        settings: {
          open: "GS1 identity",
          title: "GS1 identity",
          description: "Assign a GTIN.",
          loadError: "Could not load.",
          saveError: "Could not save.",
          saveSuccess: "Saved.",
          removeError: "Could not remove.",
          removeSuccess: "Removed.",
          gtinInvalid: "Invalid GTIN.",
          gtinConflict: "GTIN already used.",
          componentInvalid: "Use up to 20 GS1 characters.",
          draftOnly: "Draft only.",
          frozenNotice: "Published — identity frozen.",
          gtin: { label: "GTIN", placeholder: "e.g. 4006381333931" },
          batch: { label: "Batch", placeholder: "optional" },
          serial: { label: "Serial", placeholder: "optional" },
          digitalLink: { label: "GS1 Digital Link" },
          empty: "No GS1 identity assigned yet.",
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import Gs1SettingsDialog from "./Gs1SettingsDialog.vue";

function mountDialog(
  props: {
    passportId?: string;
    status?: "Draft" | "Published" | "Archived";
    visible?: boolean;
  } = {},
) {
  return mount(Gs1SettingsDialog, {
    global: {
      plugins: [i18n],
      stubs: {
        Dialog: DialogStub,
        InputText: InputTextStub,
        Button: ButtonStub,
        QrCode: QrCodeStub,
        Message: MessageStub,
      },
    },
    props: { visible: true, passportId: "passport-1", status: "Draft", ...props },
  });
}

function axiosError(status: number) {
  return { isAxiosError: true, response: { status } };
}

describe("Gs1SettingsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGs1Identity.mockReset();
    setGs1Identity.mockReset();
    deleteGs1Identity.mockReset();
  });

  it("renders the empty state when the passport has no GS1 identity (404)", async () => {
    getGs1Identity.mockRejectedValueOnce(axiosError(404));
    const wrapper = mountDialog();
    await nextTick();
    await nextTick();
    expect(wrapper.find("[data-testid='gs1-empty']").exists()).toBe(true);
    expect(wrapper.find(".qr-stub").exists()).toBe(false);
  });

  it("loads an existing GS1 identity and renders the QR for its Digital Link", async () => {
    getGs1Identity.mockResolvedValueOnce({
      data: {
        uuid: "u1",
        referenceId: "passport-1",
        gtin: "04006381333931",
        digitalLink: "https://id.example.com/01/04006381333931",
      },
    });
    const wrapper = mountDialog();
    await nextTick();
    await nextTick();
    const qr = wrapper.find(".qr-stub");
    expect(qr.exists()).toBe(true);
    expect(qr.attributes("data-link")).toBe("https://id.example.com/01/04006381333931");
    const link = wrapper.find("[data-testid='gs1-digital-link']");
    expect(link.text()).toContain("/01/04006381333931");
  });

  it("saves the GTIN via the save button and shows the resulting Digital Link", async () => {
    getGs1Identity.mockRejectedValueOnce(axiosError(404));
    setGs1Identity.mockResolvedValueOnce({
      data: {
        uuid: "u1",
        referenceId: "passport-1",
        gtin: "04006381333931",
        digitalLink: "https://id.example.com/01/04006381333931",
      },
    });
    const wrapper = mountDialog();
    await nextTick();
    await nextTick();

    await wrapper.find("[data-testid='gs1-gtin-input']").setValue("4006381333931");
    await wrapper.find("[data-testid='gs1-save-btn']").trigger("click");
    await nextTick();
    await nextTick();

    expect(setGs1Identity).toHaveBeenCalledWith("passport-1", {
      gtin: "4006381333931",
      batch: "",
      serial: "",
    });
    expect(addSuccessNotification).toHaveBeenCalled();
    expect(wrapper.find("[data-testid='gs1-digital-link']").text()).toContain("/01/04006381333931");
  });

  it("loads an existing identity's batch and serial into the inputs", async () => {
    getGs1Identity.mockResolvedValueOnce({
      data: {
        uuid: "u1",
        referenceId: "passport-1",
        gtin: "04006381333931",
        batch: "LOT-42",
        serial: "SN-001",
        digitalLink: "https://id.example.com/01/04006381333931/10/LOT-42/21/SN-001",
      },
    });
    const wrapper = mountDialog();
    await nextTick();
    await nextTick();
    expect(
      (wrapper.find("[data-testid='gs1-batch-input']").element as HTMLInputElement).value,
    ).toBe("LOT-42");
    expect(
      (wrapper.find("[data-testid='gs1-serial-input']").element as HTMLInputElement).value,
    ).toBe("SN-001");
  });

  it("saves the GTIN together with batch and serial", async () => {
    getGs1Identity.mockRejectedValueOnce(axiosError(404));
    setGs1Identity.mockResolvedValueOnce({
      data: {
        uuid: "u1",
        referenceId: "passport-1",
        gtin: "04006381333931",
        batch: "LOT-42",
        serial: "SN-001",
        digitalLink: "https://id.example.com/01/04006381333931/10/LOT-42/21/SN-001",
      },
    });
    const wrapper = mountDialog();
    await nextTick();
    await nextTick();

    await wrapper.find("[data-testid='gs1-gtin-input']").setValue("4006381333931");
    await wrapper.find("[data-testid='gs1-batch-input']").setValue("LOT-42");
    await wrapper.find("[data-testid='gs1-serial-input']").setValue("SN-001");
    await wrapper.find("[data-testid='gs1-save-btn']").trigger("click");
    await nextTick();
    await nextTick();

    expect(setGs1Identity).toHaveBeenCalledWith("passport-1", {
      gtin: "4006381333931",
      batch: "LOT-42",
      serial: "SN-001",
    });
  });

  it("clears batch and serial by sending empty strings", async () => {
    getGs1Identity.mockResolvedValueOnce({
      data: {
        uuid: "u1",
        referenceId: "passport-1",
        gtin: "04006381333931",
        batch: "LOT-42",
        serial: "SN-001",
        digitalLink: "https://id.example.com/01/04006381333931/10/LOT-42/21/SN-001",
      },
    });
    setGs1Identity.mockResolvedValueOnce({
      data: {
        uuid: "u1",
        referenceId: "passport-1",
        gtin: "04006381333931",
        batch: null,
        serial: null,
        digitalLink: "https://id.example.com/01/04006381333931",
      },
    });
    const wrapper = mountDialog();
    await nextTick();
    await nextTick();

    await wrapper.find("[data-testid='gs1-batch-input']").setValue("");
    await wrapper.find("[data-testid='gs1-serial-input']").setValue("");
    await wrapper.find("[data-testid='gs1-save-btn']").trigger("click");
    await nextTick();
    await nextTick();

    expect(setGs1Identity).toHaveBeenCalledWith("passport-1", {
      gtin: "04006381333931",
      batch: "",
      serial: "",
    });
  });

  it("shows a live validation error and blocks save for an invalid serial", async () => {
    getGs1Identity.mockRejectedValueOnce(axiosError(404));
    const wrapper = mountDialog();
    await nextTick();
    await nextTick();

    await wrapper.find("[data-testid='gs1-gtin-input']").setValue("4006381333931");
    await wrapper.find("[data-testid='gs1-serial-input']").setValue("bad value");
    await nextTick();

    expect(wrapper.find("[data-testid='gs1-serial-error']").exists()).toBe(true);
    const saveBtn = wrapper.find("[data-testid='gs1-save-btn']");
    expect(saveBtn.attributes("disabled")).toBeDefined();

    // an invalid serial must never reach the API
    await saveBtn.trigger("click");
    await nextTick();
    expect(setGs1Identity).not.toHaveBeenCalled();
  });

  it("shows a live validation error for an over-length batch", async () => {
    getGs1Identity.mockRejectedValueOnce(axiosError(404));
    const wrapper = mountDialog();
    await nextTick();
    await nextTick();

    await wrapper.find("[data-testid='gs1-gtin-input']").setValue("4006381333931");
    await wrapper.find("[data-testid='gs1-batch-input']").setValue("x".repeat(21));
    await nextTick();

    expect(wrapper.find("[data-testid='gs1-batch-error']").exists()).toBe(true);
  });

  it("shows the invalid-GTIN error on a 400 response", async () => {
    getGs1Identity.mockRejectedValueOnce(axiosError(404));
    setGs1Identity.mockRejectedValueOnce(axiosError(400));
    const wrapper = mountDialog();
    await nextTick();
    await nextTick();

    await wrapper.find("[data-testid='gs1-gtin-input']").setValue("4006381333930");
    await wrapper.find("[data-testid='gs1-save-btn']").trigger("click");
    await nextTick();
    await nextTick();

    expect(wrapper.find("[data-testid='gs1-gtin-error']").text()).toBe("Invalid GTIN.");
  });

  it("shows the conflict error on a 409 response while draft", async () => {
    getGs1Identity.mockRejectedValueOnce(axiosError(404));
    setGs1Identity.mockRejectedValueOnce(axiosError(409));
    const wrapper = mountDialog();
    await nextTick();
    await nextTick();

    await wrapper.find("[data-testid='gs1-gtin-input']").setValue("00012345678905");
    await wrapper.find("[data-testid='gs1-save-btn']").trigger("click");
    await nextTick();
    await nextTick();

    expect(wrapper.find("[data-testid='gs1-gtin-error']").text()).toBe("GTIN already used.");
  });

  it("disables the GTIN input for a published passport", async () => {
    getGs1Identity.mockResolvedValueOnce({
      data: {
        uuid: "u1",
        referenceId: "passport-1",
        gtin: "04006381333931",
        digitalLink: "https://id.example.com/01/04006381333931",
      },
    });
    const wrapper = mountDialog({ status: "Published" });
    await nextTick();
    await nextTick();
    expect(wrapper.find("[data-testid='gs1-gtin-input']").attributes("disabled")).toBeDefined();
  });

  it("shows the frozen-identity notice for a published passport and hides it while draft", async () => {
    getGs1Identity.mockResolvedValue({
      data: {
        uuid: "u1",
        referenceId: "passport-1",
        gtin: "04006381333931",
        digitalLink: "https://id.example.com/01/04006381333931",
      },
    });
    const published = mountDialog({ status: "Published" });
    await nextTick();
    await nextTick();
    const notice = published.find("[data-testid='gs1-frozen-notice']");
    expect(notice.exists()).toBe(true);
    expect(notice.text()).toBe("Published — identity frozen.");

    const draft = mountDialog({ status: "Draft" });
    await nextTick();
    await nextTick();
    expect(draft.find("[data-testid='gs1-frozen-notice']").exists()).toBe(false);
  });

  it("offers a remove action for a draft passport with an existing identity and removes it", async () => {
    getGs1Identity.mockResolvedValueOnce({
      data: {
        uuid: "u1",
        referenceId: "passport-1",
        gtin: "04006381333931",
        digitalLink: "https://id.example.com/01/04006381333931",
      },
    });
    deleteGs1Identity.mockResolvedValueOnce({});
    const wrapper = mountDialog({ status: "Draft" });
    await nextTick();
    await nextTick();

    const removeBtn = wrapper.find("[data-testid='gs1-remove-btn']");
    expect(removeBtn.exists()).toBe(true);

    await removeBtn.trigger("click");
    await nextTick();
    await nextTick();

    expect(deleteGs1Identity).toHaveBeenCalledWith("passport-1");
    expect(addSuccessNotification).toHaveBeenCalled();
    expect(wrapper.emitted("removed")).toBeTruthy();
  });

  it("hides the remove action when the draft passport has no GS1 identity", async () => {
    getGs1Identity.mockRejectedValueOnce(axiosError(404));
    const wrapper = mountDialog({ status: "Draft" });
    await nextTick();
    await nextTick();
    expect(wrapper.find("[data-testid='gs1-remove-btn']").exists()).toBe(false);
  });

  it("hides the remove action for a published passport even when an identity exists", async () => {
    getGs1Identity.mockResolvedValueOnce({
      data: {
        uuid: "u1",
        referenceId: "passport-1",
        gtin: "04006381333931",
        digitalLink: "https://id.example.com/01/04006381333931",
      },
    });
    const wrapper = mountDialog({ status: "Published" });
    await nextTick();
    await nextTick();
    expect(wrapper.find("[data-testid='gs1-remove-btn']").exists()).toBe(false);
  });

  it("surfaces a remove error and keeps the dialog open on failure", async () => {
    getGs1Identity.mockResolvedValueOnce({
      data: {
        uuid: "u1",
        referenceId: "passport-1",
        gtin: "04006381333931",
        digitalLink: "https://id.example.com/01/04006381333931",
      },
    });
    deleteGs1Identity.mockRejectedValueOnce(axiosError(500));
    const wrapper = mountDialog({ status: "Draft" });
    await nextTick();
    await nextTick();

    await wrapper.find("[data-testid='gs1-remove-btn']").trigger("click");
    await nextTick();
    await nextTick();

    expect(logErrorWithNotification).toHaveBeenCalled();
    expect(wrapper.emitted("removed")).toBeFalsy();
  });
});
