import type {
  LanguageTextDto,
  PropertyResponseDto,
  SubmodelElementResponseDto,
} from "@open-dpp/dto";
import { DataTypeDef, KeyTypes } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, ref } from "vue";
import SubmodelElement from "./SubmodelElement.vue";

const localeRef = ref("en");

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    locale: localeRef,
    t: (key: string) => key,
  }),
}));

// The value renderer and the dispatch both reach for the passport store, which is
// irrelevant to how the caption and its description are rendered.
vi.mock("./SubmodelElementValue.vue", () => ({
  default: { name: "SubmodelElementValue", render: () => null },
}));

vi.mock("../../lib/presentation/presentation-dispatch.ts", () => ({
  usePresentationDispatch: () => ({
    name: computed(() => undefined),
    component: computed(() => undefined),
    selfCaptioning: computed(() => false),
  }),
}));

function makeElement(description: LanguageTextDto[]): SubmodelElementResponseDto {
  const element: PropertyResponseDto = {
    idShort: "material",
    valueType: DataTypeDef.String,
    value: "cotton",
    displayName: [{ language: "en", text: "Material" }],
    description,
    extensions: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
  };
  return { ...element, modelType: KeyTypes.Property };
}

function mountElement(description: LanguageTextDto[], locale = "en") {
  localeRef.value = locale;
  return mount(SubmodelElement, { props: { element: makeElement(description) } });
}

describe("SubmodelElement", () => {
  beforeEach(() => {
    localeRef.value = "en";
  });

  it("renders the description of the data field", () => {
    const wrapper = mountElement([{ language: "en", text: "The fabric it is made of" }]);

    expect(wrapper.get("dt p").text()).toBe("The fabric it is made of");
  });

  it("renders the description in the selected language", () => {
    const wrapper = mountElement(
      [
        { language: "en", text: "The fabric it is made of" },
        { language: "de", text: "Der Stoff, aus dem es besteht" },
      ],
      "de",
    );

    expect(wrapper.get("dt p").text()).toBe("Der Stoff, aus dem es besteht");
  });

  it("renders no description placeholder when the data field has none", () => {
    const wrapper = mountElement([]);

    expect(wrapper.find("dt p").exists()).toBe(false);
    expect(wrapper.get("dt").text()).toBe("Material");
  });
});
