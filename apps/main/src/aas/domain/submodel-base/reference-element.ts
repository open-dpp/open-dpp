import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../parsing/json-visitor";
import { ReferenceElementJsonSchema } from "../parsing/submodel-base/reference-element-json-schema";
import { IVisitor } from "../visitor";
import { ISubmodelBase } from "./submodel";
import { SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class ReferenceElement implements ISubmodelBase {
  constructor(
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly value: Reference | null = null,
  ) {
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
      data.idShort,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.value ?? null,
    );
  }

  static fromPlain(data: unknown): ISubmodelBase {
    const parsed = ReferenceElementJsonSchema.parse(data);
    return ReferenceElement.create({
      ...submodelBasePropsFromPlain(parsed),
      extensions: parsed.extensions.map(Extension.fromPlain),
      value: parsed.value ? Reference.fromPlain(parsed.value) : undefined,
    });
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitReferenceElement(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }
}
