import { ValueError } from "@open-dpp/exception";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../parsing/json-visitor";
import { EntityTypeJsonSchema } from "../parsing/submodel-base/entity-type-json-schema";
import { SpecificAssetId } from "../specific-asset-id";
import { IVisitor } from "../visitor";
import { AasSubmodelElements, AasSubmodelElementsType } from "./aas-submodel-elements";
import {
  ISubmodelElement,
  parseSubmodelBaseUnion,
  SubmodelBaseProps,
  submodelBasePropsFromPlain,
} from "./submodel-base";

export enum EntityType {
  CoManagedEntity = "CoManagedEntity",
  SelfManagedEntity = "SelfManagedEntity",
}

export class Entity implements ISubmodelElement {
  private constructor(
    public readonly entityType: EntityType,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly statements: Array<ISubmodelElement>,
    public readonly globalAssetId: string | null = null,
    public readonly specificAssetIds: Array<SpecificAssetId>,
  ) {
  }

  static create(data: SubmodelBaseProps & {
    entityType: EntityType;
    extensions?: Array<Extension>;
    statements?: Array<ISubmodelElement>;
    globalAssetId?: string | null;
    specificAssetIds?: Array<SpecificAssetId>;
  }) {
    return new Entity(
      data.entityType,
      data.extensions ?? [],
      data.category ?? null,
      data.idShort,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.statements ?? [],
      data.globalAssetId ?? null,
      data.specificAssetIds ?? [],
    );
  };

  static fromPlain(data: unknown): ISubmodelElement {
    const parsed = EntityTypeJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new Entity(
      parsed.entityType,
      parsed.extensions.map(e => Extension.fromPlain(e)),
      baseObjects.category,
      baseObjects.idShort,
      baseObjects.displayName,
      baseObjects.description,
      baseObjects.semanticId,
      baseObjects.supplementalSemanticIds,
      baseObjects.qualifiers,
      baseObjects.embeddedDataSpecifications,
      parsed.statements.map(parseSubmodelBaseUnion),
      parsed.globalAssetId,
      parsed.specificAssetIds.map(s => SpecificAssetId.fromPlain(s)),
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitEntity(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }

  * getSubmodelElements(): IterableIterator<ISubmodelElement> {
    yield* this.statements;
  }

  addSubmodelElement(submodelElement: ISubmodelElement): ISubmodelElement {
    if (this.statements.some(s => s.idShort === submodelElement.idShort)) {
      throw new ValueError(`Submodel element with idShort ${submodelElement.idShort} already exists`);
    }
    this.statements.push(submodelElement);
    return submodelElement;
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.Entity;
  }
}
