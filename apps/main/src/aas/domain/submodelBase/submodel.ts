import { AdministrativeInformation } from "../common/administrative-information";
import { IHasDataSpecification } from "../common/has-data-specification";
import { ModellingKind } from "../common/has-kind";
import { IHasSemantics } from "../common/has-semantics";
import { LanguageText } from "../common/language-text";
import { IQualifiable, Qualifier } from "../common/qualififiable";
import { IReferable } from "../common/referable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";

export interface ISubmodelBase
  extends IReferable,
  IHasSemantics,
  IQualifiable,
  IHasDataSpecification {
  // Intentionally empty.
}

export enum AasSubmodelElements {
  AnnotatedRelationshipElement = "AnnotatedRelationshipElement",
  BasicEventElement = "BasicEventElement",
  Blob = "Blob",
  Capability = "Capability",
  ConceptDescription = "ConceptDescription",
  DataElement = "DataElement",
  Entity = "Entity",
  EventElement = "EventElement",
  File = "File",
  MultiLanguageProperty = "MultiLanguageProperty",
  Operation = "Operation",
  Property = "Property",
  Range = "Range",
  ReferenceElement = "ReferenceElement",
  RelationshipElement = "RelationshipElement",
  SubmodelElement = "SubmodelElement",
  SubmodelElementList = "SubmodelElementList",
  SubmodelElementCollection = "SubmodelElementCollection",
}

export abstract class SubmodelBase implements ISubmodelBase {
  protected constructor(
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    public readonly displayName: Array<LanguageText> | null = null,
    public readonly description: Array<LanguageText> | null = null,
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Array<Reference> | null = null,
    public readonly qualifiers: Qualifier[] | null = null,
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification> | null = null,
  ) {
  }
}

export class Submodel extends SubmodelBase {
  private constructor(
    public readonly id: string,
    public readonly extensions: Array<Extension> | null = null,
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    public readonly displayName: Array<LanguageText> | null = null,
    public readonly description: Array<LanguageText> | null = null,
    public readonly administration: AdministrativeInformation | null = null,
    public readonly kind: ModellingKind | null = null,
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Array<Reference> | null = null,
    public readonly qualifiers: Qualifier[] | null = null,
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification> | null = null,
    public readonly submodelElements: Array<ISubmodelBase> | null = null,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
  }

  static create(
    data: {
      id: string;
      extensions?: Array<Extension>;
      category?: string;
      idShort?: string;
      displayName?: Array<LanguageText>;
      description?: Array<LanguageText>;
      administration?: AdministrativeInformation;
      kind?: ModellingKind;
      semanticId?: Reference;
      supplementalSemanticIds?: Array<Reference>;
      qualifiers?: Array<Qualifier>;
      embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
      submodelElements?: Array<ISubmodelBase>;
    },
  ) {
    return new Submodel(
      data.id,
      data.extensions ?? null,
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? null,
      data.description ?? null,
      data.administration ?? null,
      data.kind ?? null,
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? null,
      data.qualifiers ?? null,
      data.embeddedDataSpecifications ?? null,
      data.submodelElements ?? null,
    );
  };
}
