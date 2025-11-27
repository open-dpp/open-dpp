import { KeyTypes } from "../common/key";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { IVisitor } from "../visitor";
import { ReferenceElementJsonSchema } from "../zod-schemas";
import { SubmodelBase, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";
import { registerSubmodel } from "./submodel-registry";

export class ReferenceElement extends SubmodelBase {
  constructor(
    public readonly extensions: Array<Extension>,
    category: string | null = null,
    idShort: string | null = null,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    semanticId: Reference | null = null,
    supplementalSemanticIds: Array<Reference>,
    qualifiers: Array<Qualifier>,
    embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly value: Reference | null = null,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
  }

  static create(
    data: SubmodelBaseProps & {
      extensions?: Array<Extension>;
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

  static fromPlain(data: Record<string, unknown>): SubmodelBase {
    const parsed = ReferenceElementJsonSchema.parse(data);
    return ReferenceElement.create({
      ...submodelBasePropsFromPlain(parsed),
      extensions: parsed.extensions.map(Extension.fromPlain),
      value: parsed.value ? Reference.fromPlain(parsed.value) : undefined,
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitReferenceElement(this);
  }
}

registerSubmodel(KeyTypes.ReferenceElement, ReferenceElement);
