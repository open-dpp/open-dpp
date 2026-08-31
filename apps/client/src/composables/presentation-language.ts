import { computed, inject, provide, watch, type Ref } from "vue";
import { BcpLanguageTagSchema, type BcpLanguageTagType } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { convertLocaleToLanguage } from "../translations/util";

const PRESENTATION_LANGUAGE_KEY = Symbol("presentationLanguage");
const QUERY_KEY = "lang";

export function providePresentationLanguage(
  initialLanguage: BcpLanguageTagType,
): Ref<BcpLanguageTagType> {
  const route = useRoute();
  const router = useRouter();
  const { locale } = useI18n();

  const language = computed<BcpLanguageTagType>({
    get: () => {
      const parsed = BcpLanguageTagSchema.safeParse(route.query[QUERY_KEY]);
      return parsed.success ? parsed.data : initialLanguage;
    },
    set: (val) => {
      const parsed = BcpLanguageTagSchema.safeParse(val);
      if (!parsed.success) return;
      router.replace({ query: { ...route.query, [QUERY_KEY]: parsed.data } });
    },
  });

  watch(
    language,
    (lang) => {
      locale.value = convertLocaleToLanguage(lang) === "de" ? "de" : "en";
    },
    { immediate: true },
  );

  provide(PRESENTATION_LANGUAGE_KEY, language);
  return language;
}

export function usePresentationLanguage(): Ref<BcpLanguageTagType> | undefined {
  return inject<Ref<BcpLanguageTagType>>(PRESENTATION_LANGUAGE_KEY);
}
