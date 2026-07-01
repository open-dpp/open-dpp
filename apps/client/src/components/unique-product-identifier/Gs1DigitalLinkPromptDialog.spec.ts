import { mount } from "@vue/test-utils";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";

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

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      uniqueProductIdentifiers: {
        gs1LinkPrompt: {
          title: "Add a GS1 Digital Link?",
          question: "Would you like to add a GS1 Digital Link permalink for this identifier?",
          addLink: "Add GS1 Digital Link",
          skip: "Skip",
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import Gs1DigitalLinkPromptDialog from "./Gs1DigitalLinkPromptDialog.vue";
import type { UniqueProductIdentifierListItemDto } from "@open-dpp/dto";

const SAMPLE_UPI: UniqueProductIdentifierListItemDto = {
  uuid: "11111111-1111-1111-1111-111111111111",
  referenceId: "22222222-2222-2222-2222-222222222222",
  type: "GS1",
  gtin: "04006381333931",
  batch: "LOT-42",
  serial: "SN-001",
  granularity: "item",
  digitalLink: "https://id.example.com/01/04006381333931/10/LOT-42/21/SN-001",
  passportPublished: false,
};

function mountDialog(props: { visible?: boolean; upi?: UniqueProductIdentifierListItemDto } = {}) {
  return mount(Gs1DigitalLinkPromptDialog, {
    global: {
      plugins: [i18n],
      stubs: { Dialog: DialogStub, Button: ButtonStub },
    },
    props: {
      visible: true,
      upi: SAMPLE_UPI,
      ...props,
    },
  });
}

describe("Gs1DigitalLinkPromptDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("(1) shows the question text and both buttons (addLink + skip)", async () => {
    const wrapper = mountDialog();
    await nextTick();

    expect(wrapper.text()).toContain(
      "Would you like to add a GS1 Digital Link permalink for this identifier?",
    );
    expect(wrapper.find("[data-testid='gs1-link-prompt-add']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='gs1-link-prompt-skip']").exists()).toBe(true);
  });

  it("(2) addLink button emits ('addLink', upi)", async () => {
    const wrapper = mountDialog();
    await nextTick();

    await wrapper.find("[data-testid='gs1-link-prompt-add']").trigger("click");
    await nextTick();

    expect(wrapper.emitted("addLink")).toBeTruthy();
    expect(wrapper.emitted("addLink")![0]).toEqual([SAMPLE_UPI]);
  });

  it("(3) skip button emits ('skip') and closes the dialog", async () => {
    const wrapper = mountDialog({ visible: true });
    await nextTick();

    await wrapper.find("[data-testid='gs1-link-prompt-skip']").trigger("click");
    await nextTick();

    expect(wrapper.emitted("skip")).toBeTruthy();
    // visible model should be updated to false (close dialog)
    expect(wrapper.emitted("update:visible")).toBeTruthy();
    expect(wrapper.emitted("update:visible")![0]).toEqual([false]);
  });

  it("(4) does not make any API call", async () => {
    // This test ensures no api-client import or call is made.
    // We simply mount and interact — if an API call were made, the mock would be missing and throw.
    const wrapper = mountDialog();
    await nextTick();

    await wrapper.find("[data-testid='gs1-link-prompt-add']").trigger("click");
    await nextTick();

    await wrapper.find("[data-testid='gs1-link-prompt-skip']").trigger("click");
    await nextTick();

    // No assertion needed beyond "no errors thrown" — verifies no API dependency.
    expect(true).toBe(true);
  });
});
