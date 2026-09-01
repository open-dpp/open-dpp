import type { LanguageTextDto } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import Submodel from "./Submodel.vue";

const localeRef = ref("en");

// Submodel only needs to render its own heading here; stubbing the child keeps the
// passport store (and its API client) out of this test.
vi.mock("./SubmodelElement.vue", () => ({
  default: { name: "SubmodelElement", render: () => null },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    locale: localeRef,
    t: (key: string) => key,
  }),
}));

function mountSubmodel(description: LanguageTextDto[], locale = "en") {
  localeRef.value = locale;
  return mount(Submodel, {
    props: {
      idShort: "section",
      title: [{ language: "en", text: "Section" }],
      description,
      submodelElements: [],
    },
    global: {
      stubs: { SubmodelElement: true },
    },
  });
}

describe("Submodel", () => {
  beforeEach(() => {
    localeRef.value = "en";
  });

  it("renders the description of the section", () => {
    const wrapper = mountSubmodel([{ language: "en", text: "What this section covers" }]);

    expect(wrapper.get("p").text()).toBe("What this section covers");
  });

  it("renders the description in the selected language", () => {
    const wrapper = mountSubmodel(
      [
        { language: "en", text: "What this section covers" },
        { language: "de", text: "Worum es in diesem Abschnitt geht" },
      ],
      "de",
    );

    expect(wrapper.get("p").text()).toBe("Worum es in diesem Abschnitt geht");
  });

  it("renders no description when the section has an empty description", () => {
    const wrapper = mountSubmodel([]);

    expect(wrapper.find("p").exists()).toBe(false);
  });

  it("still renders the section title", () => {
    const wrapper = mountSubmodel([]);

    expect(wrapper.get("h3").text()).toBe("Section");
  });
});
