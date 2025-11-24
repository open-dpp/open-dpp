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
import { IVisitable, IVisitor } from "../visitor";

export interface ISubmodelBase
  extends IReferable,
  IHasSemantics,
  IQualifiable,
  IVisitable<any>,
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
    public readonly category: string | null,
    public readonly idShort: string | null,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
  ) {
  }

  accept(visitor: IVisitor<any>): any {
    throw new Error("Method not implemented.");
  }
}

export class Submodel extends SubmodelBase {
  private constructor(
    public readonly id: string,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string | null,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly administration: AdministrativeInformation,
    public readonly kind: ModellingKind | null,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly submodelElements: Array<ISubmodelBase>,
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
      administration: AdministrativeInformation;
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
      data.extensions ?? [],
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? [],
      data.description ?? [],
      data.administration,
      data.kind ?? null,
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.submodelElements ?? [],
    );
  };

  public addSubmodelElement(submodelElement: ISubmodelBase) {
    this.submodelElements.push(submodelElement);
  }
}
