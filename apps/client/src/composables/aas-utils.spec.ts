import { Language } from "@open-dpp/dto";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAasUtils } from "./aas-utils.ts";
import { defineComponent } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { mount } from "@vue/test-utils";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: Language.en },
  }),
  createI18n: () => ({
    global: {
      t: (key: string) => key,
      locale: { value: Language.en },
    },
    install: () => {},
  }),
}));

describe("aas", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
  });

  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness() {
    const Harness = defineComponent({
      name: "use-aas-utils-harness",
      setup() {
        const api = useAasUtils();
        return { api };
      },
      template: "<div></div>",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useAasUtils>),
    };
  }

  it("should parse displayName from assetAdministrationShell", () => {
    const assetAdministrationShell1 = {
      displayName: [{ language: Language.en, text: "my name" }],
    };

    let aasUtils = mountHarness();
    expect(aasUtils.parseDisplayNameFromAas(assetAdministrationShell1)).toEqual("my name");

    aasUtils = mountHarness();
    const assetAdministrationShell2 = {
      displayName: [{ language: Language.de, text: "mein name" }],
    };
    expect(aasUtils.parseDisplayNameFromAas(assetAdministrationShell2)).toEqual("common.untitled");

    const environment = {
      assetAdministrationShells: [{ ...assetAdministrationShell1, id: "id1" }],
    };
    aasUtils = mountHarness();
    expect(aasUtils.parseDisplayNameFromEnvironment(environment)).toEqual("my name");
  });
});
