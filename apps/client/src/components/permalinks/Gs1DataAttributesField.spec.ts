import { gs1DataAttributesPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";

// ---------------------------------------------------------------------------
// Mocks (no api-client needed — pure component)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      gs1DataAttributes: {
        addRow: "Add row",
        aiPlaceholder: "AI (e.g. 17)",
        valuePlaceholder: "Value",
        remove: "Remove",
        keyAiBlocked:
          'AI "{ai}" is a primary identifier or key qualifier and cannot be used as a data attribute.',
        unknownAi: "Unknown AI.",
        invalidValue: 'Value does not match the format for AI "{ai}".',
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import Gs1DataAttributesField from "./Gs1DataAttributesField.vue";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Gs1DataAttributesField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("(a) adding a known non-key AI (17) + a valid value emits update:modelValue with {'17':'251231'}", async () => {
    const wrapper = mount(Gs1DataAttributesField, {
      global: {
        plugins: [i18n],
        stubs: { InputText: InputTextStub, Button: ButtonStub },
      },
      props: { modelValue: {} },
    });

    // Click "Add row"
    await wrapper.find("[data-testid='gs1-data-attr-add-row']").trigger("click");
    await nextTick();

    // Enter AI "17"
    const aiInput = wrapper.find("[data-testid='gs1-data-attr-ai-0']");
    await aiInput.setValue("17");
    await nextTick();

    // Enter valid value "251231"
    const valueInput = wrapper.find("[data-testid='gs1-data-attr-value-0']");
    await valueInput.setValue("251231");
    await nextTick();

    // Confirm: emits update:modelValue with { '17': '251231' }
    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    const lastEmit = emitted![emitted!.length - 1]![0] as Record<string, string>;
    expect(lastEmit).toEqual({ "17": "251231" });
  });

  it("(b) a key AI (01) is blocked with an error message and NOT emitted", async () => {
    const wrapper = mount(Gs1DataAttributesField, {
      global: {
        plugins: [i18n],
        stubs: { InputText: InputTextStub, Button: ButtonStub },
      },
      props: { modelValue: {} },
    });

    await wrapper.find("[data-testid='gs1-data-attr-add-row']").trigger("click");
    await nextTick();

    const aiInput = wrapper.find("[data-testid='gs1-data-attr-ai-0']");
    await aiInput.setValue("01");
    await nextTick();

    // Error message should be visible
    const errorEl = wrapper.find("[data-testid='gs1-data-attr-ai-error-0']");
    expect(errorEl.exists()).toBe(true);
    expect(errorEl.text()).toContain("01");

    // Should NOT emit
    expect(wrapper.emitted("update:modelValue")).toBeFalsy();
  });

  it("(b2) key AI (10) is blocked", async () => {
    const wrapper = mount(Gs1DataAttributesField, {
      global: {
        plugins: [i18n],
        stubs: { InputText: InputTextStub, Button: ButtonStub },
      },
      props: { modelValue: {} },
    });

    await wrapper.find("[data-testid='gs1-data-attr-add-row']").trigger("click");
    await nextTick();

    await wrapper.find("[data-testid='gs1-data-attr-ai-0']").setValue("10");
    await nextTick();

    expect(wrapper.find("[data-testid='gs1-data-attr-ai-error-0']").exists()).toBe(true);
    expect(wrapper.emitted("update:modelValue")).toBeFalsy();
  });

  it("(b3) key AI (21) is blocked", async () => {
    const wrapper = mount(Gs1DataAttributesField, {
      global: {
        plugins: [i18n],
        stubs: { InputText: InputTextStub, Button: ButtonStub },
      },
      props: { modelValue: {} },
    });

    await wrapper.find("[data-testid='gs1-data-attr-add-row']").trigger("click");
    await nextTick();

    await wrapper.find("[data-testid='gs1-data-attr-ai-0']").setValue("21");
    await nextTick();

    expect(wrapper.find("[data-testid='gs1-data-attr-ai-error-0']").exists()).toBe(true);
    expect(wrapper.emitted("update:modelValue")).toBeFalsy();
  });

  it("(c) an unknown AI shows an inline error and is NOT emitted", async () => {
    const wrapper = mount(Gs1DataAttributesField, {
      global: {
        plugins: [i18n],
        stubs: { InputText: InputTextStub, Button: ButtonStub },
      },
      props: { modelValue: {} },
    });

    await wrapper.find("[data-testid='gs1-data-attr-add-row']").trigger("click");
    await nextTick();

    await wrapper.find("[data-testid='gs1-data-attr-ai-0']").setValue("9999");
    await nextTick();

    expect(wrapper.find("[data-testid='gs1-data-attr-ai-error-0']").exists()).toBe(true);
    expect(wrapper.emitted("update:modelValue")).toBeFalsy();
  });

  it("(c2) a value failing format/length shows an inline error and is NOT emitted", async () => {
    const wrapper = mount(Gs1DataAttributesField, {
      global: {
        plugins: [i18n],
        stubs: { InputText: InputTextStub, Button: ButtonStub },
      },
      props: { modelValue: {} },
    });

    await wrapper.find("[data-testid='gs1-data-attr-add-row']").trigger("click");
    await nextTick();

    // AI 17 (Expiration date) requires exactly N6 format (6 digits)
    await wrapper.find("[data-testid='gs1-data-attr-ai-0']").setValue("17");
    await nextTick();

    // Invalid value for AI 17 (too short)
    await wrapper.find("[data-testid='gs1-data-attr-value-0']").setValue("25123");
    await nextTick();

    const valueError = wrapper.find("[data-testid='gs1-data-attr-value-error-0']");
    expect(valueError.exists()).toBe(true);

    // Should NOT emit
    expect(wrapper.emitted("update:modelValue")).toBeFalsy();
  });

  it("(d) removing a row deletes the key immutably — emits new map without that key", async () => {
    const wrapper = mount(Gs1DataAttributesField, {
      global: {
        plugins: [i18n],
        stubs: { InputText: InputTextStub, Button: ButtonStub },
      },
      props: {
        modelValue: gs1DataAttributesPlainFactory.build(
          {},
          { transient: { entries: { "17": "251231", "3103": "000189" } } },
        ),
      },
    });
    await nextTick();

    // Remove the first row (AI 17)
    await wrapper.find("[data-testid='gs1-data-attr-remove-0']").trigger("click");
    await nextTick();

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    const lastEmit = emitted![emitted!.length - 1]![0] as Record<string, string>;
    // Only 3103 remains; 17 was removed immutably
    expect(lastEmit).toEqual({ "3103": "000189" });
    expect(lastEmit).not.toHaveProperty("17");
  });
});
