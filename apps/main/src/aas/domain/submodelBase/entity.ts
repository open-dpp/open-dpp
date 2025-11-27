import { KeyTypes } from "../common/key";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { SpecificAssetId } from "../specific-asset-id";
import { IVisitor } from "../visitor";
import { EntityTypeJsonSchema } from "../zod-schemas";
import { ISubmodelBase } from "./submodel";
import { parseSubmodelBaseUnion, SubmodelBase, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";
import { registerSubmodel } from "./submodel-registry";

export enum EntityType {
  CoManagedEntity = "CoManagedEntity",
  SelfManagedEntity = "SelfManagedEntity",
}

export class Entity extends SubmodelBase {
  private constructor(
    public readonly entityType: EntityType,
    public readonly extensions: Array<Extension>,
    category: string | null = null,
    idShort: string | null = null,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    semanticId: Reference | null = null,
    supplementalSemanticIds: Array<Reference>,
    qualifiers: Array<Qualifier>,
    embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly statements: Array<ISubmodelBase>,
    public readonly globalAssetId: string | null = null,
    public readonly specificAssetIds: Array<SpecificAssetId>,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
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
      data.idShort ?? null,
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

  static fromPlain(data: Record<string, unknown>): SubmodelBase {
    const parsed = EntityTypeJsonSchema.parse(data);
    return Entity.create({
      ...submodelBasePropsFromPlain(parsed),
      entityType: parsed.entityType,
      statements: parsed.statements.map(parseSubmodelBaseUnion),
      globalAssetId: parsed.globalAssetId,
      specificAssetIds: parsed.specificAssetIds.map(s => SpecificAssetId.fromPlain(s)),
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitEntity(this);
  }
}

registerSubmodel(KeyTypes.Entity, Entity);
