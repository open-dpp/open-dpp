import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../parsing/json-visitor";
import { EntityTypeJsonSchema } from "../parsing/submodel-base/entity-type-json-schema";
import { SpecificAssetId } from "../specific-asset-id";
import { IVisitor } from "../visitor";
import { ISubmodelBase } from "./submodel";
import { parseSubmodelBaseUnion, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export enum EntityType {
  CoManagedEntity = "CoManagedEntity",
  SelfManagedEntity = "SelfManagedEntity",
}

export class Entity implements ISubmodelBase {
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
    public readonly statements: Array<ISubmodelBase>,
    public readonly globalAssetId: string | null = null,
    public readonly specificAssetIds: Array<SpecificAssetId>,
  ) {
  }

  static create(data: SubmodelBaseProps & {
    entityType: EntityType;
    extensions?: Array<Extension>;
    statements?: Array<ISubmodelBase>;
    globalAssetId?: string;
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

  static fromPlain(data: unknown): ISubmodelBase {
    const parsed = EntityTypeJsonSchema.parse(data);
    return Entity.create({
      ...submodelBasePropsFromPlain(parsed),
      entityType: parsed.entityType,
      statements: parsed.statements.map(parseSubmodelBaseUnion),
      globalAssetId: parsed.globalAssetId,
      specificAssetIds: parsed.specificAssetIds.map(s => SpecificAssetId.fromPlain(s)),
    });
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitEntity(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }
}
