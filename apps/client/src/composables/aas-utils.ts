import type {
  AssetAdministrationShellResponseDto,
  ExtendedEnvironmentResponseDto,
  LanguageTextDto,
  LanguageType,
} from "@open-dpp/dto";
import { match, P } from "ts-pattern";

interface AasUtilsProps {
  selectedLanguage: LanguageType;
  translate: (label: string, ...args: unknown[]) => string;
}

export interface IAasUtils {
  parseDisplayName: (displayNames: LanguageTextDto[]) => string,
  parseDisplayNameFromAas: (
    assetAdministrationShell: Pick<AssetAdministrationShellResponseDto, "displayName">,
  ) => string;
  parseDisplayNameFromEnvironment: (
    environment: Pick<ExtendedEnvironmentResponseDto, "assetAdministrationShells">,
  ) => string;
}

export function useAasUtils({ translate, selectedLanguage }: AasUtilsProps): IAasUtils {
  function parseDisplayName(displayNames: LanguageTextDto[]) {
    const displayName = displayNames.find((d) => d.language === selectedLanguage);
    return displayName?.text ?? translate("common.untitled");
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
        return translate("common.untitled");
      });
  }

  return { parseDisplayName, parseDisplayNameFromAas, parseDisplayNameFromEnvironment };
}
