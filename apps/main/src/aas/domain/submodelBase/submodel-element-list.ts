import { DataTypeDef } from "../common/data-type-def";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { AasSubmodelElements, ISubmodelBase, SubmodelBase } from "./submodel";

export class SubmodelElementList extends SubmodelBase {
  private constructor(
    public readonly typeValueListElement: AasSubmodelElements,
    public readonly extensions: Array<Extension> | null = null,
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    public readonly displayName: Array<LanguageText> | null = null,
    public readonly description: Array<LanguageText> | null = null,
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Array<Reference> | null = null,
    public readonly qualifiers: Qualifier[] | null = null,
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification> | null = null,
    public readonly orderRelevant: boolean | null = null,
    public readonly semanticIdListElement: Reference | null = null,
    public readonly valueTypeListElement: DataTypeDef | null = null,
    public readonly value: Array<ISubmodelBase> | null = null,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
  }

  static create(data: {
    typeValueListElement: AasSubmodelElements;
    extensions?: Array<Extension>;
    category?: string;
    idShort?: string;
    displayName?: Array<LanguageText>;
    description?: Array<LanguageText>;
    semanticId?: Reference;
    supplementalSemanticIds?: Array<Reference>;
    qualifiers?: Array<Qualifier>;
    embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
    orderRelevant?: boolean;
    semanticIdListElement?: Reference;
    valueTypeListElement?: DataTypeDef;
    value?: Array<ISubmodelBase>;
  }) {
    return new SubmodelElementList(
      data.typeValueListElement,
      data.extensions ?? null,
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? null,
      data.description ?? null,
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? null,
      data.qualifiers ?? null,
      data.embeddedDataSpecifications ?? null,
      data.orderRelevant ?? null,
      data.semanticIdListElement ?? null,
      data.valueTypeListElement ?? null,
      data.value ?? null,
    );
  }
}
