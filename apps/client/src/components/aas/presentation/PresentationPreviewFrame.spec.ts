import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import { defineComponent, h } from "vue";
import { DataTypeDef, KeyTypes, PresentationComponentName } from "@open-dpp/dto";
import type {
  PresentationConfigurationDto,
  PropertyResponseDto,
  SubmodelElementResponseDto,
} from "@open-dpp/dto";
import PresentationPreviewFrame from "./PresentationPreviewFrame.vue";
import { usePresentationConfigurationStore } from "../../../stores/presentation-configuration";

vi.mock("../../presentation/SubmodelElementValue.vue", () => ({
  default: defineComponent({
    name: "SubmodelElementValueStub",
    props: {
      element: { type: Object, required: true },
      path: { type: String, default: undefined },
      config: { type: Object, default: null },
    },
    setup(props) {
      return () =>
        h(
          "div",
          { "data-cy": "submodel-element-value-stub" },
          JSON.stringify({ value: (props.element as PropertyResponseDto).value }),
        );
    },
  }),
}));

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      aasEditor: {
        presentationTab: {
          preview: "Preview",
          previewSampleBadge: "Using sample value",
        },
      },
    },
  },
});

function makeProperty(overrides: Partial<PropertyResponseDto> = {}): SubmodelElementResponseDto {
  const property: PropertyResponseDto = {
    idShort: "Revenue",
    valueType: DataTypeDef.Decimal,
    value: null,
    displayName: [],
    description: [],
    extensions: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    ...overrides,
  };
  return { ...property, modelType: KeyTypes.Property } as unknown as SubmodelElementResponseDto;
}

function makeConfig(
  overrides: Partial<PresentationConfigurationDto> = {},
): PresentationConfigurationDto {
  return {
    id: "config-1",
    organizationId: "org-1",
    referenceId: "ref-1",
    referenceType: "template",
    label: null,
    elementDesign: {},
    defaultComponents: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as PresentationConfigurationDto;
}

function mountFrame(
  props: { element: SubmodelElementResponseDto; path: string },
  config: PresentationConfigurationDto | null = makeConfig(),
) {
  if (config) {
    const store = usePresentationConfigurationStore();
    store.configs = [config];
  }
  return mount(PresentationPreviewFrame, {
    global: { plugins: [i18n] },
    props,
  });
}

describe("PresentationPreviewFrame", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("renders the Preview header label", () => {
    const wrapper = mountFrame({
      element: makeProperty(),
      path: "submodel.revenue",
    });
    expect(wrapper.find('[data-cy="presentation-preview-frame"]').text()).toContain("Preview");
  });

  it("renders SubmodelElementValue with the (potentially sampled) element", () => {
    const wrapper = mountFrame(
      {
        element: makeProperty({ value: null, valueType: DataTypeDef.Long }),
        path: "submodel.revenue",
      },
      makeConfig({ elementDesign: { "submodel.revenue": PresentationComponentName.BigNumber } }),
    );
    const stub = wrapper.find('[data-cy="submodel-element-value-stub"]');
    expect(stub.exists()).toBe(true);
    expect(stub.text()).toContain('"value":"1234567"');
  });

  it("passes real value through unchanged when present", () => {
    const wrapper = mountFrame(
      {
        element: makeProperty({ value: "42", valueType: DataTypeDef.Long }),
        path: "submodel.revenue",
      },
      makeConfig({ elementDesign: { "submodel.revenue": PresentationComponentName.BigNumber } }),
    );
    const stub = wrapper.find('[data-cy="submodel-element-value-stub"]');
    expect(stub.text()).toContain('"value":"42"');
  });

  it("shows the sample badge when value was substituted", () => {
    const wrapper = mountFrame(
      {
        element: makeProperty({ value: null, valueType: DataTypeDef.Long }),
        path: "submodel.revenue",
      },
      makeConfig({ elementDesign: { "submodel.revenue": PresentationComponentName.BigNumber } }),
    );
    expect(wrapper.find('[data-cy="presentation-preview-sample-badge"]').exists()).toBe(true);
  });

  it("hides the sample badge when value was not substituted", () => {
    const wrapper = mountFrame(
      {
        element: makeProperty({ value: "1500000", valueType: DataTypeDef.Long }),
        path: "submodel.revenue",
      },
      makeConfig({ elementDesign: { "submodel.revenue": PresentationComponentName.BigNumber } }),
    );
    expect(wrapper.find('[data-cy="presentation-preview-sample-badge"]').exists()).toBe(false);
  });

  it("hides the sample badge when no component resolves (falls through to default rendering)", () => {
    const wrapper = mountFrame(
      {
        element: makeProperty({ value: "42", valueType: DataTypeDef.Decimal }),
        path: "submodel.revenue",
      },
      makeConfig(),
    );
    const stub = wrapper.find('[data-cy="submodel-element-value-stub"]');
    expect(stub.exists()).toBe(true);
    expect(stub.text()).toContain('"value":"42"');
    expect(wrapper.find('[data-cy="presentation-preview-sample-badge"]').exists()).toBe(false);
  });
});
