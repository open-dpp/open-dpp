import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { SubmodelBase } from "./submodel";

export class ReferenceElement extends SubmodelBase {
  constructor(
    public readonly extensions: Array<Extension>,
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Array<Qualifier>,
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly value: Reference | null = null,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
  }

  static create(
    data: {
      extensions?: Array<Extension>;
      category?: string;
      idShort?: string;
      displayName?: Array<LanguageText>;
      description?: Array<LanguageText>;
      semanticId?: Reference;
      supplementalSemanticIds?: Array<Reference>;
      qualifiers?: Array<Qualifier>;
      embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
      value?: Reference;
    },
  ) {
    return new ReferenceElement(
      data.extensions ?? [],
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.value ?? null,
    );
  }
}
