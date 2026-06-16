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

const SelectStub = defineComponent({
  name: "Select",
  inheritAttrs: false,
  props: ["modelValue", "options", "optionValue", "optionLabel", "placeholder", "disabled"],
  emits: ["update:modelValue"],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        "select",
        {
          value: props.modelValue ?? "",
          disabled: props.disabled,
          "data-testid": attrs["data-testid"],
          onChange: (e: Event) => {
            const val = (e.target as HTMLSelectElement).value;
            emit("update:modelValue", val || undefined);
          },
        },
        (props.options ?? []).map((opt: Record<string, unknown>) =>
          h("option", { value: String(opt[props.optionValue ?? "id"] ?? "") }),
        ),
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
          title: "Create GS1 Unique Product Identifier",
          selectDraftPassport: "Select a draft passport",
          gtin: "GTIN",
          batch: "Batch / Lot (optional)",
          serial: "Serial (optional)",
          submit: "Create",
          noDraftPassports: "No draft passports available.",
          gtinInvalid: "Invalid GTIN.",
          componentInvalid: "Use up to 20 GS1 characters.",
          duplicate: "This GS1 identity is already assigned.",
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import UniqueProductIdentifierCreateDialog from "./UniqueProductIdentifierCreateDialog.vue";
import type { PassportDto, UniqueProductIdentifierListItemDto } from "@open-dpp/dto";

const DRAFT_PASSPORT_1: PassportDto = {
  id: "passport-1",
  organizationId: "org-1",
  environment: { assetAdministrationShells: [], submodels: [], conceptDescriptions: [] },
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  lastStatusChange: {
    currentStatus: "Draft",
    previousStatus: null,
  },
  templateId: null,
};

const DRAFT_PASSPORT_2: PassportDto = {
  id: "passport-2",
  organizationId: "org-1",
  environment: { assetAdministrationShells: [], submodels: [], conceptDescriptions: [] },
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  lastStatusChange: {
    currentStatus: "Draft",
    previousStatus: null,
  },
  templateId: null,
};

type CreateGs1UpiFn = (data: {
  referenceId: string;
  gtin: string;
  batch?: string;
  serial?: string;
}) => Promise<UniqueProductIdentifierListItemDto>;

function mountDialog(
  props: {
    visible?: boolean;
    draftPassports?: PassportDto[];
    createGs1Upi?: CreateGs1UpiFn;
  } = {},
) {
  const defaultHandler: CreateGs1UpiFn = vi.fn();
  const createHandler: CreateGs1UpiFn = props.createGs1Upi ?? defaultHandler;
  return mount(UniqueProductIdentifierCreateDialog, {
    global: {
      plugins: [i18n],
      stubs: {
        Dialog: DialogStub,
        InputText: InputTextStub,
        Button: ButtonStub,
        Select: SelectStub,
        Message: MessageStub,
      },
    },
    props: {
      visible: true,
      draftPassports: props.draftPassports ?? [DRAFT_PASSPORT_1, DRAFT_PASSPORT_2],
      createGs1Upi: createHandler,
      ...props,
    },
  });
}

describe("UniqueProductIdentifierCreateDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createUpi.mockReset();
  });

  it("(1) renders a passport Select + GTIN/batch/serial inputs", async () => {
    const wrapper = mountDialog();
    await nextTick();

    expect(wrapper.find("[data-testid='upi-create-passport']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='upi-create-gtin']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='upi-create-batch']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='upi-create-serial']").exists()).toBe(true);
  });

  it("(2) invalid batch shows an error and disables submit", async () => {
    const wrapper = mountDialog();
    await nextTick();

    // Select a passport first
    await wrapper.find("[data-testid='upi-create-passport']").setValue("passport-1");
    await nextTick();

    // Set a valid GTIN
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

    await wrapper.find("[data-testid='upi-create-passport']").setValue("passport-1");
    await nextTick();
    await wrapper.find("[data-testid='upi-create-gtin']").setValue("4006381333931");
    await nextTick();
    await wrapper.find("[data-testid='upi-create-serial']").setValue("bad value");
    await nextTick();

    expect(wrapper.find("[data-testid='upi-create-serial-error']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='upi-create-submit']").attributes("disabled")).toBeDefined();
  });

  it("(3) clicking submit with a chosen draft and valid GTIN invokes the createGs1Upi prop", async () => {
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

    await wrapper.find("[data-testid='upi-create-passport']").setValue("passport-1");
    await nextTick();
    await wrapper.find("[data-testid='upi-create-gtin']").setValue("4006381333931");
    await nextTick();

    await wrapper.find("[data-testid='upi-create-submit']").trigger("click");
    await nextTick();
    await nextTick();

    expect(createGs1Upi).toHaveBeenCalledWith({
      referenceId: "passport-1",
      gtin: "4006381333931",
      batch: undefined,
      serial: undefined,
    });
  });

  it("(3b) clicking submit with batch and serial passes them in the call", async () => {
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

    await wrapper.find("[data-testid='upi-create-passport']").setValue("passport-1");
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

    expect(createGs1Upi).toHaveBeenCalledWith({
      referenceId: "passport-1",
      gtin: "4006381333931",
      batch: "LOT-42",
      serial: "SN-001",
    });
  });

  it("(4) with NO draft passports submit is disabled and a noDraftPassports notice is shown", async () => {
    const wrapper = mountDialog({ draftPassports: [] });
    await nextTick();

    expect(wrapper.find("[data-testid='upi-no-draft-passports']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='upi-create-submit']").attributes("disabled")).toBeDefined();
  });

  it("submit is disabled when no passport is selected (even with valid GTIN)", async () => {
    const wrapper = mountDialog();
    await nextTick();

    // Fill in a valid GTIN but don't select a passport
    await wrapper.find("[data-testid='upi-create-gtin']").setValue("4006381333931");
    await nextTick();

    expect(wrapper.find("[data-testid='upi-create-submit']").attributes("disabled")).toBeDefined();
  });

  it("submit is disabled when no GTIN is entered", async () => {
    const wrapper = mountDialog();
    await nextTick();

    await wrapper.find("[data-testid='upi-create-passport']").setValue("passport-1");
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

    await wrapper.find("[data-testid='upi-create-passport']").setValue("passport-1");
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
