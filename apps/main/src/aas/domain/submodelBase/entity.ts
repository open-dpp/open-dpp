import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { SpecificAssetId } from "../specific-asset-id";
import { SubmodelBase } from "./submodel";

export enum EntityType {
  CoManagedEntity = "CoManagedEntity",
  SelfManagedEntity = "SelfManagedEntity",
}

export class Entity extends SubmodelBase {
  private constructor(
    public readonly entityType: EntityType,
    public readonly extensions: Array<Extension> | null = null,
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    public readonly displayName: Array<LanguageText> | null = null,
    public readonly description: Array<LanguageText> | null = null,
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Array<Reference> | null = null,
    public readonly qualifiers: Array<Qualifier> | null = null,
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification> | null = null,
    public readonly statements: Array<SubmodelBase> | null = null,
    public readonly globalAssetId: string | null = null,
    public readonly specificAssetIds: Array<SpecificAssetId> | null = null,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
  }

  static create(data: {
    entityType: EntityType;
    extensions?: Array<Extension>;
    category?: string;
    idShort?: string;
    displayName?: Array<LanguageText>;
    description?: Array<LanguageText>;
    semanticId?: Reference;
    supplementalSemanticIds?: Array<Reference>;
    qualifiers?: Array<Qualifier>;
    embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
    statements?: Array<SubmodelBase>;
    globalAssetId?: string;
    specificAssetIds?: Array<SpecificAssetId>;
  }) {
    return new Entity(
      data.entityType,
      data.extensions ?? null,
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? null,
      data.description ?? null,
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? null,
      data.qualifiers ?? null,
      data.embeddedDataSpecifications ?? null,
      data.statements ?? null,
      data.globalAssetId ?? null,
      data.specificAssetIds ?? null,
    );
  };
}
