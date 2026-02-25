import { setActivePinia, createPinia } from "pinia";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("primevue", () => ({
  usePrimeVue: vi.fn().mockReturnValue({
    config: {
      locale: "en-US",
    },
  }),
}));

vi.mock("dayjs", () => ({
  default: {
    locale: vi.fn(),
  },
}));

vi.mock("../translations/i18n", () => ({
  i18n: {
    global: {
      locale: { value: "en-US" },
    },
  },
}));

vi.mock("../translations/primevue/de.ts", () => ({
  dePrimeVue: { locale: "de" },
}));

vi.mock("../translations/primevue/en.ts", () => ({
  enPrimeVue: { locale: "en" },
}));

vi.mock("../const.ts", () => ({
  LAST_SELECTED_LANGUAGE: "open-dpp-local-last-language",
  DEFAULT_LANGUAGE: "en-US",
}));

import { useLanguageStore } from "./language";

describe("languageStore - DEFAULT_LANGUAGE persistence", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should initialize with 'en' shortLocale", () => {
    const store = useLanguageStore();
    expect(store.shortLocale).toBe("en");
  });

  it("should save full locale to localStorage when onI18nLocaleChange is called", () => {
    const store = useLanguageStore();
    store.onI18nLocaleChange("de-DE");

    const savedLocale = localStorage.getItem("open-dpp-local-last-language");
    expect(savedLocale).toBe("de-DE");
  });

  it("should convert full locale (de-DE) to short locale (de)", () => {
    const store = useLanguageStore();
    store.onI18nLocaleChange("de-DE");

    expect(store.shortLocale).toBe("de");
  });

  it("should convert full locale (en-US) to short locale (en)", () => {
    const store = useLanguageStore();
    store.onI18nLocaleChange("en-US");

    expect(store.shortLocale).toBe("en");
  });

  it("should persist locale when switching between languages", () => {
    const store = useLanguageStore();

    store.onI18nLocaleChange("de-DE");
    expect(localStorage.getItem("open-dpp-local-last-language")).toBe("de-DE");

    store.onI18nLocaleChange("en-US");
    expect(localStorage.getItem("open-dpp-local-last-language")).toBe("en-US");
  });

  it("should handle en-GB locale format", () => {
    const store = useLanguageStore();
    store.onI18nLocaleChange("en-GB");

    expect(store.shortLocale).toBe("en");
    expect(localStorage.getItem("open-dpp-local-last-language")).toBe("en-GB");
  });

  it("should fallback to 'en' for unsupported locales", () => {
    const store = useLanguageStore();
    store.onI18nLocaleChange("fr-FR");

    expect(store.shortLocale).toBe("en");
    expect(localStorage.getItem("open-dpp-local-last-language")).toBe("fr-FR");
  });
});