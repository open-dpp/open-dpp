import type {
  AssetAdministrationShellResponseDto,
  ExtendedEnvironmentResponseDto,
  LanguageType,
} from "@open-dpp/dto";
import { match, P } from "ts-pattern";

interface AasUtilsProps {
  selectedLanguage: LanguageType;
  translate: (label: string, ...args: unknown[]) => string;
}

export interface IAasUtils {
  parseDisplayNameFromAas: (
    assetAdministrationShell: Pick<
      AssetAdministrationShellResponseDto,
      "displayName"
    >,
  ) => string;
  parseDisplayNameFromEnvironment: (
    environment: Pick<
      ExtendedEnvironmentResponseDto,
      "assetAdministrationShells"
    >,
  ) => string;
}

export function useAasUtils({ translate, selectedLanguage }: AasUtilsProps): IAasUtils {
  function parseDisplayNameFromAas(
    assetAdministrationShell: Pick<AssetAdministrationShellResponseDto, "displayName">,
  ): string {
    const displayName = assetAdministrationShell.displayName.find(
      d => d.language === selectedLanguage,
    );
    return displayName?.text ?? translate("common.untitled");
  }

  function parseDisplayNameFromEnvironment(
    environment: Pick<ExtendedEnvironmentResponseDto, "assetAdministrationShells">,
  ): string {
    return match(environment).with({
      assetAdministrationShells: [{ id: P.string, displayName: P.array() }],
    }, ({ assetAdministrationShells }) => {
      return parseDisplayNameFromAas(assetAdministrationShells[0]);
    }).otherwise(() => {
      return translate("common.untitled");
    });
  }

  return { parseDisplayNameFromAas, parseDisplayNameFromEnvironment };
}
