import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { IHasDataSpecification } from "./common/has-data-specification";
import { IIdentifiable } from "./common/identifiable";
import { LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { EmbeddedDataSpecification } from "./embedded-data-specification";
import { Extension } from "./extension";
import { AssetAdministrationShellJsonSchema } from "./parsing/asset-administration-shell-json-schema";
import { JsonVisitor } from "./parsing/json-visitor";
import { IPersistable } from "./persistable";
import { IVisitable, IVisitor } from "./visitor";

export class AssetAdministrationShell implements IIdentifiable, IHasDataSpecification, IVisitable<any>, IPersistable {
  private constructor(
    public readonly id: string,
    public readonly assetInformation: AssetInformation,
    public readonly extensions: Extension[],
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    public readonly displayName: LanguageText[],
    public readonly description: LanguageText[],
    public readonly administration: AdministrativeInformation | null = null,
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
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
      data.extensions ?? [],
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? [],
      data.description ?? [],
      data.administration ?? null,
      data.embeddedDataSpecifications ?? [],
      data.derivedFrom ?? null,
      data.submodels ?? [],
    );
  };

  addSubmodelReference(submodel: Reference) {
    this.submodels.push(submodel);
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitAssetAdministrationShell(this);
  }

  static fromPlain(data: unknown): AssetAdministrationShell {
    const parsed = AssetAdministrationShellJsonSchema.parse(data);
    return AssetAdministrationShell.create({
      id: parsed.id,
      assetInformation: AssetInformation.fromPlain(parsed.assetInformation),
      extensions: parsed.extensions.map(Extension.fromPlain),
      category: parsed.category,
      idShort: parsed.idShort,
      displayName: parsed.displayName.map(LanguageText.fromPlain),
      description: parsed.description.map(LanguageText.fromPlain),
      administration: parsed.administration ? AdministrativeInformation.fromPlain(parsed.administration) : undefined,
      embeddedDataSpecifications: parsed.embeddedDataSpecifications.map(EmbeddedDataSpecification.fromPlain),
      derivedFrom: parsed.derivedFrom ? Reference.fromPlain(parsed.derivedFrom) : undefined,
    });
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }
}
