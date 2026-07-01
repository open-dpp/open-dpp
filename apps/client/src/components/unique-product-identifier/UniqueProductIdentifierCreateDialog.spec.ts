import { uniqueProductIdentifierCreateRequestPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { createUpi } = vi.hoisted(() => ({
  createUpi: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      uniqueProductIdentifiers: {
        create: createUpi,
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

vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Component stubs
// ---------------------------------------------------------------------------

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

const MessageStub = defineComponent({
  name: "Message",
  inheritAttrs: false,
  props: ["severity", "closable"],
  setup(_props, { slots, attrs }) {
    return () =>
      h("div", { class: "message-stub", "data-testid": attrs["data-testid"] }, slots.default?.());
  },
});

const SelectButtonStub = defineComponent({
  name: "SelectButton",
  inheritAttrs: false,
  props: ["modelValue", "options", "optionLabel", "optionValue", "allowEmpty", "disabled"],
  emits: ["update:modelValue"],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        "select",
        {
          "data-testid": attrs["data-testid"],
          value: props.modelValue,
          disabled: props.disabled,
          onChange: (e: Event) => emit("update:modelValue", (e.target as HTMLSelectElement).value),
        },
        (props.options ?? []).map((o: { label: string; value: string }) =>
          h("option", { value: o.value }, o.label),
        ),
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
      common: { cancel: "Cancel", save: "Save", remove: "Remove" },
      uniqueProductIdentifiers: {
        create: {
          title: "Create Unique Product Identifier",
          type: "Type",
          typeGs1: "GS1",
          typeInternal: "Internal (open-dpp)",
          description: "Enter a GTIN, e.g. 04006381333931.",
          internalDescription: "An internal identifier will be generated automatically.",
          gtin: "GTIN",
          batch: "Batch / Lot (optional)",
          serial: "Serial (optional)",
          submit: "Create",
          passportNotDraft: "This passport is published.",
          gtinInvalid: "Invalid GTIN.",
          componentInvalid: "Use up to 20 GS1 characters.",
          duplicate: "This GS1 identity is already assigned.",
          createFailed: "Could not create the identifier.",
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import UniqueProductIdentifierCreateDialog from "./UniqueProductIdentifierCreateDialog.vue";
import type { UniqueProductIdentifierListItemDto } from "@open-dpp/dto";

type CreateGs1UpiFn = (data: {
  referenceId: string;
  gtin: string;
  batch?: string;
  serial?: string;
}) => Promise<UniqueProductIdentifierListItemDto>;

type CreateInternalUpiFn = (passportId: string) => Promise<UniqueProductIdentifierListItemDto>;

function mountDialog(
  props: {
    visible?: boolean;
    passportId?: string;
    isDraft?: boolean;
    createGs1Upi?: CreateGs1UpiFn;
    createInternalUpi?: CreateInternalUpiFn;
  } = {},
) {
  const defaultHandler: CreateGs1UpiFn = vi.fn();
  const defaultInternalHandler: CreateInternalUpiFn = vi.fn();
  return mount(UniqueProductIdentifierCreateDialog, {
    global: {
      plugins: [i18n],
      stubs: {
        Dialog: DialogStub,
        InputText: InputTextStub,
        Button: ButtonStub,
        Message: MessageStub,
        SelectButton: SelectButtonStub,
      },
    },
    props: {
      visible: true,
      passportId: "passport-1",
      isDraft: true,
      createGs1Upi: defaultHandler,
      createInternalUpi: defaultInternalHandler,
      ...props,
    },
  });
}

describe("UniqueProductIdentifierCreateDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createUpi.mockReset();
  });

  it("(1) renders GTIN/batch/serial inputs and NO passport select", async () => {
    const wrapper = mountDialog();
    await nextTick();

    expect(wrapper.find("[data-testid='upi-create-passport']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='upi-create-gtin']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='upi-create-batch']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='upi-create-serial']").exists()).toBe(true);
  });

  it("(2) invalid batch shows an error and disables submit", async () => {
    const wrapper = mountDialog();
    await nextTick();

    await wrapper.find("[data-testid='upi-create-gtin']").setValue("4006381333931");
    await nextTick();

    // Set an invalid batch (contains space — not CSET-82)
    await wrapper.find("[data-testid='upi-create-batch']").setValue("bad value");
    await nextTick();

    expect(wrapper.find("[data-testid='upi-create-batch-error']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='upi-create-submit']").attributes("disabled")).toBeDefined();
  });

  it("(2b) invalid serial shows an error and disables submit", async () => {
    const wrapper = mountDialog();
    await nextTick();

    await wrapper.find("[data-testid='upi-create-gtin']").setValue("4006381333931");
    await nextTick();
    await wrapper.find("[data-testid='upi-create-serial']").setValue("bad value");
    await nextTick();

    expect(wrapper.find("[data-testid='upi-create-serial-error']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='upi-create-submit']").attributes("disabled")).toBeDefined();
  });

  it("(3) submit with a valid GTIN invokes createGs1Upi for the route's passport", async () => {
    const createGs1Upi = vi.fn().mockResolvedValueOnce({
      uuid: "new-upi",
      referenceId: "passport-1",
      type: "GS1",
      gtin: "04006381333931",
      batch: null,
      serial: null,
      granularity: "model",
      digitalLink: null,
      passportPublished: false,
    });

    const wrapper = mountDialog({ createGs1Upi });
    await nextTick();

    await wrapper.find("[data-testid='upi-create-gtin']").setValue("4006381333931");
    await nextTick();

    await wrapper.find("[data-testid='upi-create-submit']").trigger("click");
    await nextTick();
    await nextTick();

    expect(createGs1Upi).toHaveBeenCalledWith(
      uniqueProductIdentifierCreateRequestPlainFactory.build({
        referenceId: "passport-1",
        gtin: "4006381333931",
      }),
    );
  });

  it("(3b) submit with batch and serial passes them in the call", async () => {
    const createGs1Upi = vi.fn().mockResolvedValueOnce({
      uuid: "new-upi",
      referenceId: "passport-1",
      type: "GS1",
      gtin: "04006381333931",
      batch: "LOT-42",
      serial: "SN-001",
      granularity: "batch",
      digitalLink: null,
      passportPublished: false,
    });

    const wrapper = mountDialog({ createGs1Upi });
    await nextTick();

    await wrapper.find("[data-testid='upi-create-gtin']").setValue("4006381333931");
    await nextTick();
    await wrapper.find("[data-testid='upi-create-batch']").setValue("LOT-42");
    await nextTick();
    await wrapper.find("[data-testid='upi-create-serial']").setValue("SN-001");
    await nextTick();

    await wrapper.find("[data-testid='upi-create-submit']").trigger("click");
    await nextTick();
    await nextTick();

    expect(createGs1Upi).toHaveBeenCalledWith(
      uniqueProductIdentifierCreateRequestPlainFactory.build(
        {
          referenceId: "passport-1",
          gtin: "4006381333931",
        },
        { transient: { batch: "LOT-42", serial: "SN-001" } },
      ),
    );
  });

  it("(4) when the passport is NOT a draft, submit is disabled and a notice is shown", async () => {
    const wrapper = mountDialog({ isDraft: false });
    await nextTick();

    await wrapper.find("[data-testid='upi-create-gtin']").setValue("4006381333931");
    await nextTick();

    expect(wrapper.find("[data-testid='upi-passport-not-draft']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='upi-create-submit']").attributes("disabled")).toBeDefined();
  });

  it("submit is disabled when no GTIN is entered", async () => {
    const wrapper = mountDialog();
    await nextTick();

    expect(wrapper.find("[data-testid='upi-create-submit']").attributes("disabled")).toBeDefined();
  });

  it("emits 'created' with the new UPI on successful submit", async () => {
    const createdUpi = {
      uuid: "new-upi",
      referenceId: "passport-1",
      type: "GS1",
      gtin: "04006381333931",
      batch: null,
      serial: null,
      granularity: "model",
      digitalLink: null,
      passportPublished: false,
    };
    const createGs1Upi = vi.fn().mockResolvedValueOnce(createdUpi);

    const wrapper = mountDialog({ createGs1Upi });
    await nextTick();

    await wrapper.find("[data-testid='upi-create-gtin']").setValue("4006381333931");
    await nextTick();

    await wrapper.find("[data-testid='upi-create-submit']").trigger("click");
    await nextTick();
    await nextTick();

    expect(wrapper.emitted("created")).toBeTruthy();
    expect(wrapper.emitted("created")![0]).toEqual([createdUpi]);
  });
});
