import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { IHasDataSpecification } from "./common/has-data-specification";
import { IIdentifiable } from "./common/identifiable";
import { LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { EmbeddedDataSpecification } from "./embedded-data-specification";
import { Extension } from "./extension";

export class AssetAdministrationShell implements IIdentifiable, IHasDataSpecification {
  private constructor(
    public readonly id: string,
    public readonly assetInformation: AssetInformation,
    public readonly extensions: Extension[] | null = null,
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    public readonly displayName: LanguageText[] | null = null,
    public readonly description: LanguageText[] | null = null,
    public readonly administration: AdministrativeInformation | null = null,
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification> | null = null,
    public readonly derivedFrom: Reference | null = null,
    public readonly submodels: Array<Reference>,
  ) {
  }

  static create(
    data: {
      id: string;
      assetInformation: AssetInformation;
      extensions?: Extension[];
      category?: string;
      idShort?: string;
      displayName?: LanguageText[];
      description?: LanguageText[];
      administration?: AdministrativeInformation;
      embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
      derivedFrom?: Reference;
      submodels?: Array<Reference>;
    },
  ) {
    return new AssetAdministrationShell(
      data.id,
      data.assetInformation,
      data.extensions ?? null,
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? null,
      data.description ?? null,
      data.administration ?? null,
      data.embeddedDataSpecifications ?? null,
      data.derivedFrom ?? null,
      data.submodels ?? [],
    );
  };

  fromJson(data: {
    id: string;
    assetInformation: AssetInformation;
    extensions?: Extension[];
    category?: string;
    idShort?: string;
    displayName?: LanguageText[];
    description?: LanguageText[];
    administration?: AdministrativeInformation;
    embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
    derivedFrom?: Reference;
    submodels?: Array<Reference>;
  }) {

  }

  addSubmodelReference(submodel: Reference) {
    this.submodels.push(submodel);
  }
}
