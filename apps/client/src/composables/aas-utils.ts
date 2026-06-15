import type {
  AssetAdministrationShellResponseDto,
  ExtendedEnvironmentResponseDto,
  LanguageTextDto,
} from "@open-dpp/dto";
import { match, P } from "ts-pattern";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { convertLocaleToLanguage } from "../translations/util";

export interface IAasUtils {
  parseDisplayName: (displayNames: LanguageTextDto[]) => string,
  parseDisplayNameFromAas: (
    assetAdministrationShell: Pick<AssetAdministrationShellResponseDto, "displayName">,
  ) => string;
  parseDisplayNameFromEnvironment: (
    environment: Pick<ExtendedEnvironmentResponseDto, "assetAdministrationShells">,
  ) => string;
}

export function useAasUtils(): IAasUtils {
  const { t, locale } = useI18n();
  const selectedLanguage = computed(() => convertLocaleToLanguage(locale.value));

  function parseDisplayName(displayNames: LanguageTextDto[]) {
    const displayName = displayNames.find((d) => d.language === selectedLanguage.value);
    return displayName?.text ?? t("common.untitled");
  }

  function parseDisplayNameFromAas(
    assetAdministrationShell: Pick<AssetAdministrationShellResponseDto, "displayName">,
  ): string {
    return parseDisplayName(assetAdministrationShell.displayName);
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
          return parseDisplayNameFromAas(assetAdministrationShells[0]);
        },
      )
      .otherwise(() => {
        return t("common.untitled");
      });
  }

  return { parseDisplayName, parseDisplayNameFromAas, parseDisplayNameFromEnvironment };
}
