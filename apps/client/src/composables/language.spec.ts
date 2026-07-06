import { Language } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLanguageSelect } from "./language";
import { setActivePinia, createPinia } from "pinia";
import { defineComponent, ref } from "vue";

vi.mock("@vueuse/core", () => ({
  usePreferredLanguages: vi.fn(() => ref([])),
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: Language["en"] },
  }),
  createI18n: () => ({
    global: {
      t: (key: string) => key,
      locale: { value: Language["en"] },
    },
    install: () => {},
  }),
}));

import { usePreferredLanguages } from "@vueuse/core";

describe("language", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
  });

  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness() {
    const Harness = defineComponent({
      name: "use-language-select-harness",
      setup() {
        const api = useLanguageSelect();
        return { api };
      },
      template: "<div></div>",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useLanguageSelect>),
    };
  }

  it("Should get preferred languages from browser preferences", () => {
    vi.mocked(usePreferredLanguages).mockReturnValue(ref(["en-US", "de", "fr-FR"]));
    const { preferredLanguages } = mountHarness();
    expect(preferredLanguages.value).toEqual(new Set([Language.en, Language.de, Language.fr]));
  });

  it("Should return empty set when no browser language matches a known language", () => {
    vi.mocked(usePreferredLanguages).mockReturnValue(ref(["xx-XX", "zz"]));
    const { preferredLanguages } = mountHarness();
    expect(preferredLanguages.value).toEqual(new Set());
  });

  it("Should match exact language codes", () => {
    vi.mocked(usePreferredLanguages).mockReturnValue(ref(["de", "en"]));
    const { preferredLanguages } = mountHarness();
    expect(preferredLanguages.value).toEqual(new Set([Language.de, Language.en]));
  });

  it("Should deduplicate when full and short locale resolve to same language", () => {
    vi.mocked(usePreferredLanguages).mockReturnValue(ref(["en", "en-US"]));
    const { preferredLanguages } = mountHarness();
    expect(preferredLanguages.value).toEqual(new Set([Language.en]));
  });
});
