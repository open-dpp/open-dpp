/**
 * Slice 72 — PermalinkCreateGs1LinkDialog (pick a UPI + data attributes + resolver base)
 *
 * Failing tests first (RED), then the component is implemented (GREEN).
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";
import type { UniqueProductIdentifierListItemDto } from "@open-dpp/dto";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { listUpis, createPermalink } = vi.hoisted(() => ({
  listUpis: vi.fn(),
  createPermalink: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      uniqueProductIdentifiers: {
        list: listUpis,
      },
      permalinks: {
        create: createPermalink,
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
  props: ["visible", "header", "modal"],
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

const SelectStub = defineComponent({
  name: "Select",
  inheritAttrs: false,
  props: [
    "modelValue",
    "options",
    "optionValue",
    "optionLabel",
    "optionDisabled",
    "placeholder",
    "disabled",
    "loading",
    "filter",
  ],
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
        (props.options ?? []).map((opt: Record<string, unknown>) => {
          // optionLabel can be a string key or a function
          const labelFn = props.optionLabel;
          const label =
            typeof labelFn === "function"
              ? String(labelFn(opt) ?? "")
              : String(opt[labelFn ?? "label"] ?? "");
          return h(
            "option",
            {
              value: String(opt[props.optionValue ?? "uuid"] ?? ""),
              disabled: props.optionDisabled
                ? Boolean(opt[props.optionDisabled])
                : false,
            },
            label,
          );
        }),
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

/** Stub for Gs1DataAttributesField — emits update:modelValue when the internal input changes */
const Gs1DataAttributesFieldStub = defineComponent({
  name: "Gs1DataAttributesField",
  inheritAttrs: false,
  props: ["modelValue"],
  emits: ["update:modelValue"],
  setup(props, { emit, attrs }) {
    return () =>
      h("input", {
        "data-testid": attrs["data-testid"] ?? "gs1-data-attributes-field",
        value: JSON.stringify(props.modelValue ?? {}),
        onInput: (e: Event) => {
          try {
            emit("update:modelValue", JSON.parse((e.target as HTMLInputElement).value));
          } catch {
            // ignore
          }
        },
      });
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
      common: { cancel: "Cancel", save: "Save" },
      permalink: {
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
    },
  },
});

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const GS1_UPI_1: UniqueProductIdentifierListItemDto = {
  uuid: "11111111-1111-1111-1111-111111111111",
  referenceId: "aaaa0000-0000-0000-0000-000000000001",
  type: "GS1",
  gtin: "04006381333931",
  batch: "LOT-42",
  serial: null,
  granularity: "batch",
  digitalLink: "https://id.example.com/01/04006381333931/10/LOT-42",
  passportPublished: false,
};

const GS1_UPI_2: UniqueProductIdentifierListItemDto = {
  uuid: "22222222-2222-2222-2222-222222222222",
  referenceId: "aaaa0000-0000-0000-0000-000000000002",
  type: "GS1",
  gtin: "04006381333931",
  batch: null,
  serial: null,
  granularity: "model",
  digitalLink: null,
  passportPublished: false,
};

const SYSTEM_UPI: UniqueProductIdentifierListItemDto = {
  uuid: "33333333-3333-3333-3333-333333333333",
  referenceId: "aaaa0000-0000-0000-0000-000000000003",
  type: "OPEN_DPP_UUID",
  gtin: null,
  batch: null,
  serial: null,
  granularity: null,
  digitalLink: null,
  passportPublished: false,
};

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

import PermalinkCreateGs1LinkDialog from "./PermalinkCreateGs1LinkDialog.vue";

function mountDialog(
  props: {
    visible?: boolean;
    /** UPIs that already have a gs1-link permalink (pre-existing). */
    existingGs1LinkUpiIds?: string[];
  } = {},
) {
  return mount(PermalinkCreateGs1LinkDialog, {
    global: {
      plugins: [i18n],
      stubs: {
        Dialog: DialogStub,
        InputText: InputTextStub,
        Button: ButtonStub,
        Select: SelectStub,
        Message: MessageStub,
        Gs1DataAttributesField: Gs1DataAttributesFieldStub,
      },
    },
    props: {
      visible: true,
      existingGs1LinkUpiIds: props.existingGs1LinkUpiIds ?? [],
      ...props,
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PermalinkCreateGs1LinkDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: two GS1 UPIs + one system UPI (cursor envelope shape)
    listUpis.mockResolvedValue({
      data: { paging_metadata: { cursor: null }, result: [GS1_UPI_1, GS1_UPI_2, SYSTEM_UPI] },
    });
  });

  it("(a) the UPI Select lists GS1 UPIs; label shows GTIN + key qualifiers", async () => {
    const wrapper = mountDialog();
    await nextTick();
    // Allow the async onMounted fetch to complete
    await nextTick();
    await nextTick();

    const select = wrapper.find("[data-testid='gs1-link-upi-select']");
    expect(select.exists()).toBe(true);

    // Both GS1 UPIs should appear as options
    const options = select.findAll("option");
    // GS1_UPI_1 label: GTIN + batch qualifier
    const labels = options.map((o) => o.text());
    expect(labels.some((l) => l.includes("04006381333931"))).toBe(true);
    // GS1_UPI_2 with no batch/serial still shows the GTIN
    expect(labels.some((l) => l.includes("04006381333931"))).toBe(true);
  });

  it("(b) selecting a UPI that already has a gs1-link permalink disables Save + shows the at-most-one message", async () => {
    const wrapper = mountDialog({
      existingGs1LinkUpiIds: [GS1_UPI_1.uuid],
    });
    await nextTick();
    await nextTick();
    await nextTick();

    // Select the UPI that already has a gs1-link
    const select = wrapper.find("[data-testid='gs1-link-upi-select']");
    await select.setValue(GS1_UPI_1.uuid);
    await nextTick();

    const saveBtn = wrapper.find("[data-testid='gs1-link-create-submit']");
    expect(saveBtn.attributes("disabled")).toBeDefined();

    const msg = wrapper.find("[data-testid='gs1-link-already-linked-msg']");
    expect(msg.exists()).toBe(true);
  });

  it("(c) Save calls permalinks.create with gs1-link body and emits created", async () => {
    const createdPermalink = {
      id: "new-pl-id",
      kind: "gs1-link",
      slug: null,
      baseUrl: null,
      publishedUrl: null,
      presentationConfigurationId: null,
      uniqueProductIdentifierId: GS1_UPI_1.uuid,
      primary: false,
      gs1ResolverBase: null,
      gs1DataAttributes: null,
      publicUrl: "https://example.com/gs1",
      fallbackBaseUrl: "https://example.com",
      fallbackBaseUrlSource: "instance",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    createPermalink.mockResolvedValueOnce({ data: createdPermalink });

    const wrapper = mountDialog();
    await nextTick();
    await nextTick();
    await nextTick();

    // Select UPI 1 (no existing gs1-link)
    const select = wrapper.find("[data-testid='gs1-link-upi-select']");
    await select.setValue(GS1_UPI_1.uuid);
    await nextTick();

    // Click Save
    const saveBtn = wrapper.find("[data-testid='gs1-link-create-submit']");
    expect(saveBtn.attributes("disabled")).toBeUndefined();

    await saveBtn.trigger("click");
    await nextTick();
    await nextTick();

    expect(createPermalink).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "gs1-link",
        uniqueProductIdentifierId: GS1_UPI_1.uuid,
      }),
    );
    expect(wrapper.emitted("created")).toBeTruthy();
  });

  it("(d) a 409 response surfaces an inline error and keeps the dialog open", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 409 },
    };
    createPermalink.mockRejectedValueOnce(axiosError);

    // Patch isAxiosError so the component can detect it
    vi.doMock("axios", () => ({
      isAxiosError: (e: unknown) =>
        !!(e as Record<string, unknown>).isAxiosError,
    }));

    const wrapper = mountDialog();
    await nextTick();
    await nextTick();
    await nextTick();

    const select = wrapper.find("[data-testid='gs1-link-upi-select']");
    await select.setValue(GS1_UPI_1.uuid);
    await nextTick();

    const saveBtn = wrapper.find("[data-testid='gs1-link-create-submit']");
    await saveBtn.trigger("click");
    await nextTick();
    await nextTick();

    // Dialog remains visible (we did not emit 'created' and did not close)
    const conflictError = wrapper.find("[data-testid='gs1-link-conflict-error']");
    expect(conflictError.exists()).toBe(true);

    // Not emitted
    expect(wrapper.emitted("created")).toBeFalsy();
  });

  it("(e) Save is disabled when no UPI has been chosen", async () => {
    const wrapper = mountDialog();
    await nextTick();
    await nextTick();

    const saveBtn = wrapper.find("[data-testid='gs1-link-create-submit']");
    expect(saveBtn.attributes("disabled")).toBeDefined();
  });
});
