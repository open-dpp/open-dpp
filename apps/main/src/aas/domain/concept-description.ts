import { AdministrativeInformation } from "./common/administrative-information";
import { IHasDataSpecification } from "./common/has-data-specification";
import { IIdentifiable } from "./common/identifiable";
import { LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { EmbeddedDataSpecification } from "./embedded-data-specification";
import { Extension } from "./extension";
import { ConceptDescriptionJsonSchema } from "./parsing/concept-description-json-schema";
import { IVisitable, IVisitor } from "./visitor";

export class ConceptDescription implements IIdentifiable, IHasDataSpecification, IVisitable<any> {
  private constructor(
    public readonly id: string,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null = null,
    public readonly idShort: string | null = null,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null = null,
    public readonly administration: AdministrativeInformation | null = null,
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly isCaseOf: Reference[],
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
      data.extensions ?? [],
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.administration ?? null,
      data.embeddedDataSpecifications ?? [],
      data.isCaseOf ?? [],
    );
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitConceptDescription(this);
  }

  static fromPlain(data: Record<string, unknown>): ConceptDescription {
    const parsed = ConceptDescriptionJsonSchema.parse(data);
    return ConceptDescription.create({
      id: parsed.id,
      extensions: parsed.extensions.map(Extension.fromPlain),
      category: parsed.category,
      idShort: parsed.idShort,
      displayName: parsed.displayName.map(LanguageText.fromPlain),
      description: parsed.description.map(LanguageText.fromPlain),
      semanticId: parsed.semanticId ? Reference.fromPlain(parsed.semanticId) : undefined,
      administration: parsed.administration ? AdministrativeInformation.fromPlain(parsed.administration) : undefined,
      embeddedDataSpecifications: parsed.embeddedDataSpecifications.map(EmbeddedDataSpecification.fromPlain),
    });
  }
}
