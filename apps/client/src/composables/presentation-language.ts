import { inject, provide, type Ref } from "vue";
import type { LanguageType } from "@open-dpp/dto";
import { useLocalStorage } from "@vueuse/core";

const PRESENTATION_LANGUAGE_KEY = Symbol("presentationLanguage");
const STORAGE_KEY = "presentation-language";

export function providePresentationLanguage(initialLanguage: LanguageType): Ref<LanguageType> {
  const language = useLocalStorage<LanguageType>(STORAGE_KEY, initialLanguage);
  provide(PRESENTATION_LANGUAGE_KEY, language);
  return language;
}

export function usePresentationLanguage(): Ref<LanguageType> | undefined {
  return inject<Ref<LanguageType>>(PRESENTATION_LANGUAGE_KEY);
}
