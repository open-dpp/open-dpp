import { randomUUID } from "node:crypto";
import { AssetAdministrationShellJsonSchema } from "@open-dpp/dto";
import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { IHasDataSpecification } from "./common/has-data-specification";
import { IIdentifiable } from "./common/identifiable";
import { LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { EmbeddedDataSpecification } from "./embedded-data-specification";
import { Extension } from "./extension";
import { JsonVisitor } from "./json-visitor";
import { IPersistable } from "./persistable";
import { IVisitable, IVisitor } from "./visitor";

export class AssetAdministrationShell implements IIdentifiable, IHasDataSpecification, IVisitable, IPersistable {
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
      id?: string;
      assetInformation: AssetInformation;
      extensions?: Extension[];
      category?: string | null;
      idShort?: string | null;
      displayName?: LanguageText[];
      description?: LanguageText[];
      administration?: AdministrativeInformation;
      embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
      derivedFrom?: Reference | null;
      submodels?: Array<Reference>;
    },
  ) {
    return new AssetAdministrationShell(
      data.id ?? randomUUID(),
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

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitAssetAdministrationShell(this, context);
  }

  static fromPlain(data: unknown): AssetAdministrationShell {
    const parsed = AssetAdministrationShellJsonSchema.parse(data);
    return new AssetAdministrationShell(
      parsed.id,
      AssetInformation.fromPlain(parsed.assetInformation),
      parsed.extensions.map(Extension.fromPlain),
      parsed.category,
      parsed.idShort,
      parsed.displayName.map(LanguageText.fromPlain),
      parsed.description.map(LanguageText.fromPlain),
      parsed.administration ? AdministrativeInformation.fromPlain(parsed.administration) : null,
      parsed.embeddedDataSpecifications.map(EmbeddedDataSpecification.fromPlain),
      parsed.derivedFrom ? Reference.fromPlain(parsed.derivedFrom) : null,
      parsed.submodels.map(Reference.fromPlain),
    );
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }
}
