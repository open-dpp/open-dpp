import type {
  AssetAdministrationShellResponseDto,
  ExtendedEnvironmentResponseDto,
  LanguageTextDto,
} from "@open-dpp/dto";
import { match, P } from "ts-pattern";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { convertLocaleToLanguage } from "../translations/util";
import { usePresentationLanguage } from "./presentation-language";

export interface IAasUtils {
  parseLanguageTexts: (displayNames: LanguageTextDto[], fallback?: string) => string;
  parseLanguageTextsFromAas: (
    assetAdministrationShell: Pick<AssetAdministrationShellResponseDto, "displayName">,
  ) => string;
  parseDisplayNameFromEnvironment: (
    environment: Pick<ExtendedEnvironmentResponseDto, "assetAdministrationShells">,
  ) => string;
}

export function useAasUtils(): IAasUtils {
  const { t, locale } = useI18n();
  const presentationLanguage = usePresentationLanguage();
  const selectedLanguage = computed(
    () => presentationLanguage?.value ?? convertLocaleToLanguage(locale.value),
  );

  function parseLanguageTexts(displayNames: LanguageTextDto[], fallback?: string) {
    const baseLanguage = (tag: string) => tag.split("-")[0];

    const exactMatch = displayNames.find((d) => d.language === selectedLanguage.value);
    if (exactMatch) return exactMatch.text;

    const selectedBaseLanguage = baseLanguage(selectedLanguage.value);
    const compatibleMatch = displayNames.find(
      (d) => baseLanguage(d.language) === selectedBaseLanguage,
    );
    if (compatibleMatch) return compatibleMatch.text;

    const englishMatch = displayNames.find((d) => baseLanguage(d.language) === "en");
    if (englishMatch) return englishMatch.text;

    return fallback ?? t("common.untitled");
  }

  function parseLanguageTextsFromAas(
    assetAdministrationShell: Pick<AssetAdministrationShellResponseDto, "displayName">,
  ): string {
    return parseLanguageTexts(assetAdministrationShell.displayName);
  }

  function parseDisplayNameFromEnvironment(
    environment: Pick<ExtendedEnvironmentResponseDto, "assetAdministrationShells">,
  ): string {
    return match(environment)
      .with(
        {
          assetAdministrationShells: [{ id: P.string, displayName: P.array() }],
        },
        ({ assetAdministrationShells }) => {
          return parseLanguageTextsFromAas(assetAdministrationShells[0]);
        },
      )
      .otherwise(() => {
        return t("common.untitled");
      });
  }

  return {
    parseLanguageTexts,
    parseLanguageTextsFromAas,
    parseDisplayNameFromEnvironment,
  };
}
