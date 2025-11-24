import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { SubmodelBase } from "./submodel";

export class MultiLanguageProperty extends SubmodelBase {
  private constructor(
    public readonly extensions: Extension[],
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    public readonly displayName: LanguageText[],
    public readonly description: LanguageText[],
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Reference[],
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: EmbeddedDataSpecification[],
    public readonly value: LanguageText[],
    public readonly valueId: Reference | null = null,
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

  static create(data: {
    extensions?: Extension[];
    category?: string;
    idShort?: string;
    displayName?: LanguageText[];
    description?: LanguageText[];
    semanticId?: Reference;
    supplementalSemanticIds?: Reference[];
    qualifiers?: Qualifier[];
    embeddedDataSpecifications?: EmbeddedDataSpecification[];
    value?: LanguageText[];
    valueId?: Reference;
  }) {
    return new MultiLanguageProperty(
      data.extensions ?? [],
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.value ?? [],
      data.valueId ?? null,
    );
  }
}
