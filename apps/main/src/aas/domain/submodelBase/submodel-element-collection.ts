import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { ISubmodelBase, SubmodelBase } from "./submodel";

export class SubmodelElementCollection extends SubmodelBase {
  private constructor(
    public readonly extensions: Array<Extension>,
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly value: Array<ISubmodelBase>,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
  }

  static create(data: {
    extensions?: Array<Extension>;
    category?: string;
    idShort?: string;
    displayName?: Array<LanguageText>;
    description?: Array<LanguageText>;
    semanticId?: Reference;
    supplementalSemanticIds?: Array<Reference>;
    qualifiers?: Array<Qualifier>;
    embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
    value?: Array<ISubmodelBase>;
  }) {
    return new SubmodelElementCollection(
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
    );
  };

  addSubmodelBase(submodelBase: ISubmodelBase) {
    this.value.push(submodelBase);
  }
}
