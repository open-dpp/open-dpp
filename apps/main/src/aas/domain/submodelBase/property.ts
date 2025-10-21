import { DataTypeDef } from "../common/data-type-def";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { SubmodelBase } from "./submodel";

export class Property extends SubmodelBase {
  private constructor(
    public readonly valueType: DataTypeDef,
    public readonly extensions: Extension[] | null = null,
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    public readonly displayName: LanguageText[] | null = null,
    public readonly description: LanguageText[] | null = null,
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Reference[] | null = null,
    public readonly qualifiers: Qualifier[] | null = null,
    public readonly embeddedDataSpecifications: EmbeddedDataSpecification[] | null = null,
    public readonly value: string | null = null,
    public readonly valueId: Reference | null = null,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
  }

  static create(data: {
    valueType: DataTypeDef;
    extensions?: Extension[];
    category?: string;
    idShort?: string;
    displayName?: LanguageText[];
    description?: LanguageText[];
    semanticId?: Reference;
    supplementalSemanticIds?: Reference[];
    qualifiers?: Qualifier[];
    embeddedDataSpecifications?: EmbeddedDataSpecification[];
    value?: string;
    valueId?: Reference;
  }) {
    return new Property(
      data.valueType,
      data.extensions ?? null,
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? null,
      data.description ?? null,
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? null,
      data.qualifiers ?? null,
      data.embeddedDataSpecifications ?? null,
      data.value ?? null,
      data.valueId ?? null,
    );
  }
}
