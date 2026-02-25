import { AssetAdministrationShellCreateDto } from "@open-dpp/dto";
import { AssetAdministrationShellCreateProps } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { EmbeddedDataSpecification } from "./embedded-data-specification";
import { Extension } from "./extension";

export class AssetAdministrationShellMapper {
  static plainToAssetAdministrationShellProps(data: AssetAdministrationShellCreateDto): AssetAdministrationShellCreateProps {
    return {
      id: data.id,
      assetInformation: AssetInformation.fromPlain(data.assetInformation),
      extensions: data.extensions?.map(Extension.fromPlain),
      category: data.category,
      idShort: data.idShort,
      displayName: data.displayName?.map(LanguageText.fromPlain),
      description: data.description?.map(LanguageText.fromPlain),
      administration: data.administration ? AdministrativeInformation.fromPlain(data.administration) : undefined,
      embeddedDataSpecifications: data.embeddedDataSpecifications?.map(EmbeddedDataSpecification.fromPlain),
      derivedFrom: data.derivedFrom ? Reference.fromPlain(data.derivedFrom) : null,
      submodels: data.submodels?.map(Reference.fromPlain),
    };
  }
}
