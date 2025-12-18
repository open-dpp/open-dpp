import { ConceptDescriptionJsonSchema } from "@open-dpp/aas";
import { AdministrativeInformation } from "./common/administrative-information";
import { IHasDataSpecification } from "./common/has-data-specification";
import { IIdentifiable } from "./common/identifiable";
import { LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { EmbeddedDataSpecification } from "./embedded-data-specification";
import { Extension } from "./extension";
import { JsonVisitor } from "./json-visitor";
import { IPersistable } from "./persistable";
import { IVisitable, IVisitor } from "./visitor";

export class ConceptDescription implements IIdentifiable, IHasDataSpecification, IVisitable, IPersistable {
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
      category?: string | null;
      idShort?: string | null;
      displayName?: Array<LanguageText>;
      description?: Array<LanguageText>;
      semanticId?: Reference | null;
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

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitConceptDescription(this, context);
  }

  static fromPlain(data: unknown): ConceptDescription {
    const parsed = ConceptDescriptionJsonSchema.parse(data);
    return new ConceptDescription(
      parsed.id,
      parsed.extensions.map(Extension.fromPlain),
      parsed.category,
      parsed.idShort,
      parsed.displayName.map(LanguageText.fromPlain),
      parsed.description.map(LanguageText.fromPlain),
      parsed.semanticId ? Reference.fromPlain(parsed.semanticId) : null,
      parsed.administration ? AdministrativeInformation.fromPlain(parsed.administration) : null,
      parsed.embeddedDataSpecifications.map(EmbeddedDataSpecification.fromPlain),
      parsed.isCaseOf.map(Reference.fromPlain),
    );
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }
}
