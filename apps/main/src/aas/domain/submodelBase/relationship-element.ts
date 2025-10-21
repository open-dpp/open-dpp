import { SubmodelBase } from "./submodel";

export class IRelationshipElement {
  first: Reference;
  second: Reference;
}

export class RelationshipElement extends SubmodelBase implements IRelationshipElement {
  constructor(
    public readonly first: Reference,
    public readonly second: Reference,
    public readonly extensions: Array<Extension> | null = null,
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    public readonly displayName: Array<LanguageText> | null = null,
    public readonly description: Array<LanguageText> | null = null,
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Array<Reference> | null = null,
    public readonly qualifiers: Qualifier[] | null = null,
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification> | null = null,
  ) {
    super(
      category,
      idShort,
      displayName,
      description,
      semanticId,
      supplementalSemanticIds,
      qualifiers,
      embeddedDataSpecifications,
    );
  }

  static create(
    data: {
      first: Reference;
      second: Reference;
      extensions?: Array<Extension>;
      category?: string;
      idShort?: string;
      displayName?: Array<LanguageText>;
      description?: Array<LanguageText>;
      semanticId?: Reference;
      supplementalSemanticIds?: Array<Reference>;
      qualifiers?: Qualifier[];
      embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
    },
  ) {
    return new RelationshipElement(
      data.first,
      data.second,
      data.extensions ?? null,
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? null,
      data.description ?? null,
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? null,
      data.qualifiers ?? null,
      data.embeddedDataSpecifications ?? null,
    );
  }
}
