import { mount } from "@vue/test-utils";
import { createPinia, getActivePinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import PrimeVue from "primevue/config";
import { defineComponent, h } from "vue";
import ElementPresentationPanel from "./ElementPresentationPanel.vue";
import { usePresentationConfigurationStore } from "../../../stores/presentation-configuration";

vi.mock("./PresentationPreviewFrame.vue", () => ({
  default: defineComponent({
    name: "PresentationPreviewFrameStub",
    props: { element: { type: Object, required: true }, path: { type: String, required: true } },
    setup(props) {
      return () =>
        h("div", {
          "data-cy": "presentation-preview-frame",
          "data-path": props.path,
        });
    },
  }),
}));

// PrimeVue's Select calls window.matchMedia in its mounted hook — polyfill it for jsdom.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      aasEditor: {
        presentationTab: {
          default: "Default",
          component: "Component",
          empty: "No alternative presentation components available for this field type yet.",
          configPicker: { label: "Presentation configuration", untitled: "Untitled" },
          bigNumber: "Big number",
        },
      },
    },
  },
});

function mountPanel(
  props: Partial<{
    element: any;
    path: string;
    disabled: boolean;
  }> = {},
) {
  // Reuse the active pinia (set by beforeEach) so that
  // usePresentationConfigurationStore() in the test body and
  // inside the component share the same store instance.
  const pinia = getActivePinia()!;
  return mount(ElementPresentationPanel, {
    global: {
      plugins: [pinia, i18n, PrimeVue],
    },
    props: {
      element: { modelType: "Property", valueType: "Double", idShort: "numericField" },
      path: "submodel.numericField",
      disabled: false,
      ...props,
    },
  });
}

describe("ElementPresentationPanel", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("hides config picker when only one config exists", async () => {
    const store = usePresentationConfigurationStore();
    store.configs = [{ id: "c1", label: null, elementDesign: {} } as any];
    const wrapper = mountPanel();
    expect(wrapper.find('[data-cy="presentation-config-picker"]').exists()).toBe(false);
  });

  it("shows config picker with labels (Untitled fallback) when 2+ configs exist", async () => {
    const store = usePresentationConfigurationStore();
    store.configs = [
      { id: "c1", label: null, elementDesign: {} } as any,
      { id: "c2", label: "Variant A", elementDesign: {} } as any,
    ];
    const wrapper = mountPanel();
    expect(wrapper.find('[data-cy="presentation-config-picker"]').exists()).toBe(true);
    // Labels should appear in the rendered text (either as selected value or visible option)
    expect(wrapper.text()).toContain("Untitled");
  });

  it("shows empty-state message when no presentation components apply", async () => {
    const store = usePresentationConfigurationStore();
    store.configs = [{ id: "c1", label: null, elementDesign: {} } as any];
    const wrapper = mountPanel({
      element: { modelType: "Property", valueType: "String", idShort: "title" },
      path: "submodel.title",
    });
    expect(wrapper.find('[data-cy="presentation-empty-state"]').exists()).toBe(true);
  });

  it("calls store.setElementDesign on component change", async () => {
    const store = usePresentationConfigurationStore();
    store.configs = [{ id: "c1", label: null, elementDesign: {} } as any];
    const setSpy = vi.spyOn(store, "setElementDesign").mockResolvedValue(undefined);
    const wrapper = mountPanel();
    const select = wrapper.find('[data-cy="presentation-component-select"]');
    expect(select.exists()).toBe(true);
    // Call the component's internal handler directly via the exposed vm
    await (wrapper.vm as any).onComponentChange("BigNumber");
    expect(setSpy).toHaveBeenCalledWith("submodel.numericField", "BigNumber");
  });

  it("calls store.removeElementDesign when component change is 'default'", async () => {
    const store = usePresentationConfigurationStore();
    store.configs = [
      { id: "c1", label: null, elementDesign: { "submodel.numericField": "BigNumber" } } as any,
    ];
    const removeSpy = vi.spyOn(store, "removeElementDesign").mockResolvedValue(undefined);
    const wrapper = mountPanel();
    await (wrapper.vm as any).onComponentChange("default");
    expect(removeSpy).toHaveBeenCalledWith("submodel.numericField");
  });

  it("calls store.setActiveConfigId when config picker changes", async () => {
    const store = usePresentationConfigurationStore();
    store.configs = [
      { id: "c1", label: null, elementDesign: {} } as any,
      { id: "c2", label: "Variant A", elementDesign: {} } as any,
    ];
    const setActiveSpy = vi.spyOn(store, "setActiveConfigId");
    const wrapper = mountPanel();
    (wrapper.vm as any).onConfigChange("c2");
    expect(setActiveSpy).toHaveBeenCalledWith("c2");
  });

  it("renders the preview frame when applicable components exist", () => {
    const store = usePresentationConfigurationStore();
    store.configs = [{ id: "c1", label: null, elementDesign: {} } as any];
    const wrapper = mountPanel();
    const frame = wrapper.find('[data-cy="presentation-preview-frame"]');
    expect(frame.exists()).toBe(true);
    expect(frame.attributes("data-path")).toBe("submodel.numericField");
  });

  it("does not render the preview frame when no applicable components exist", () => {
    const store = usePresentationConfigurationStore();
    store.configs = [{ id: "c1", label: null, elementDesign: {} } as any];
    const wrapper = mountPanel({
      element: { modelType: "Property", valueType: "String", idShort: "title" },
      path: "submodel.title",
    });
    expect(wrapper.find('[data-cy="presentation-preview-frame"]').exists()).toBe(false);
  });
});
