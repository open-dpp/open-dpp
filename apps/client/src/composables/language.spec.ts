import { Language } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLanguageSelect } from "./language";
import { setActivePinia, createPinia } from "pinia";
import { defineComponent, ref } from "vue";
import { usePreferredLanguages } from "@vueuse/core";

vi.mock("@vueuse/core", () => ({
  usePreferredLanguages: vi.fn(() => ref([])),
}));

const mockLocale = vi.hoisted((): { value: string } => ({ value: "en" }));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: mockLocale,
  }),
  createI18n: () => ({
    global: {
      t: (key: string) => key,
      locale: mockLocale,
    },
    install: () => {},
  }),
}));

describe("language", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(usePreferredLanguages).mockReturnValue(ref([]));
    mockLocale.value = Language["en"];
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

  describe("nextLanguage", () => {
    it("returns undefined for an empty remaining list", () => {
      const { nextLanguage } = mountHarness();
      expect(nextLanguage([])).toBeUndefined();
    });

    it("prefers the language matching the current locale", () => {
      mockLocale.value = Language["de"];
      const { nextLanguage } = mountHarness();
      expect(nextLanguage([Language.en, Language.de, Language.fr])).toBe(Language.de);
    });

    it("falls back to a preferred browser language when locale has no match", () => {
      // locale is "en" but "en" is not in remaining; browser prefers "fr"
      vi.mocked(usePreferredLanguages).mockReturnValue(ref(["fr"]));
      const { nextLanguage } = mountHarness();
      expect(nextLanguage([Language.de, Language.fr])).toBe(Language.fr);
    });

    it("falls back to the first remaining language when nothing preferred matches", () => {
      const { nextLanguage } = mountHarness();
      expect(nextLanguage([Language["zh-Hans"], Language["zh-Hant"]])).toBe(Language["zh-Hans"]);
    });

    it("returns the only remaining language when there is just one option", () => {
      const { nextLanguage } = mountHarness();
      expect(nextLanguage([Language.fr])).toBe(Language.fr);
    });
  });

  describe("languageItems", () => {
    it("puts preferred languages in preferredItems and the rest in allItems", () => {
      vi.mocked(usePreferredLanguages).mockReturnValue(ref(["en"]));
      const { languageItems } = mountHarness();
      const items = languageItems([], "");
      expect(items.value.preferredItems.map((i) => i.key)).toContain(Language.en);
      expect(items.value.allItems.map((i) => i.key)).not.toContain(Language.en);
    });

    it("excludes ignored keys from both preferredItems and allItems", () => {
      vi.mocked(usePreferredLanguages).mockReturnValue(ref(["en", "de"]));
      const { languageItems } = mountHarness();
      const items = languageItems([Language.en], "");
      expect(items.value.preferredItems.map((i) => i.key)).not.toContain(Language.en);
      expect(items.value.allItems.map((i) => i.key)).not.toContain(Language.en);
      expect(items.value.preferredItems.map((i) => i.key)).toContain(Language.de);
    });

    it("filters by tag when filter text is set", () => {
      const { languageItems } = mountHarness();
      const items = languageItems([], "zh");
      const allKeys = items.value.allItems.map((i) => i.key);
      expect(allKeys).toContain(Language["zh-Hans"]);
      expect(allKeys).toContain(Language["zh-Hant"]);
      expect(allKeys).not.toContain(Language.en);
      expect(allKeys).not.toContain(Language.de);
    });

    it("returns all items when filter is empty", () => {
      const { languageItems } = mountHarness();
      const items = languageItems([], "");
      const allKeys = items.value.allItems.map((i) => i.key);
      expect(allKeys).toContain(Language.en);
      expect(allKeys).toContain(Language.de);
      expect(allKeys).toContain(Language["zh-Hans"]);
    });

    it("is reactive to filter ref changes", () => {
      const { languageItems } = mountHarness();
      const filter = ref("");
      const items = languageItems([], filter);
      const totalBefore = items.value.allItems.length;
      filter.value = "zh";
      expect(items.value.allItems.length).toBeLessThan(totalBefore);
      expect(items.value.allItems.map((i) => i.key)).toContain(Language["zh-Hans"]);
    });

    it("is reactive to ignoreOptions ref changes", () => {
      vi.mocked(usePreferredLanguages).mockReturnValue(ref(["en"]));
      const { languageItems } = mountHarness();
      const ignored = ref<string[]>([]);
      const items = languageItems(ignored, "");
      expect(items.value.preferredItems.map((i) => i.key)).toContain(Language.en);
      ignored.value = [Language.en];
      expect(items.value.preferredItems.map((i) => i.key)).not.toContain(Language.en);
    });

    it("accepts a getter function for ignoreOptions", () => {
      vi.mocked(usePreferredLanguages).mockReturnValue(ref(["en", "de"]));
      const { languageItems } = mountHarness();
      const items = languageItems(() => [Language.en], "");
      expect(items.value.preferredItems.map((i) => i.key)).not.toContain(Language.en);
      expect(items.value.preferredItems.map((i) => i.key)).toContain(Language.de);
    });
  });
});
