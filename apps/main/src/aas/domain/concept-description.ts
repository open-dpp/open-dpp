import { AdministrativeInformation } from "./common/administrative-information";
import { IHasDataSpecification } from "./common/has-data-specification";
import { IIdentifiable } from "./common/identifiable";
import { LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { EmbeddedDataSpecification } from "./embedded-data-specification";
import { Extension } from "./extension";

export class ConceptDescription implements IIdentifiable, IHasDataSpecification {
  private constructor(
    public readonly id: string,
    public readonly extensions: Array<Extension> | null = null,
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    public readonly displayName: Array<LanguageText> | null = null,
    public readonly description: Array<LanguageText> | null = null,
    public readonly semanticId: Reference | null = null,
    public readonly administration: AdministrativeInformation | null = null,
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification> | null = null,
    public readonly isCaseOf: Reference[] | null = null,
  ) {
  }

  static create(
    data: {
      id: string;
      extensions?: Array<Extension>;
      category?: string;
      idShort?: string;
      displayName?: Array<LanguageText>;
      description?: Array<LanguageText>;
      semanticId?: Reference;
      administration?: AdministrativeInformation;
      embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
      isCaseOf?: Reference[];
    },
  ) {
    return new ConceptDescription(
      data.id,
      data.extensions ?? null,
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? null,
      data.description ?? null,
      data.semanticId ?? null,
      data.administration ?? null,
      data.embeddedDataSpecifications ?? null,
      data.isCaseOf ?? null,
    );
  }
}
