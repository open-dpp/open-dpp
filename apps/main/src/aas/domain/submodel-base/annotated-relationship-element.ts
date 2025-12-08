import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../parsing/json-visitor";
import {
  AnnotatedRelationshipElementJsonSchema,
} from "../parsing/submodel-base/annotated-relationship-element-json-schema";
import { IVisitor } from "../visitor";
import { IRelationshipElement } from "./relationship-element";
import { ISubmodelBase } from "./submodel";
import { parseSubmodelBaseUnion, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class AnnotatedRelationshipElement implements ISubmodelBase, IRelationshipElement {
  protected constructor(
    public readonly first: Reference,
    public readonly second: Reference,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly annotations: Array<ISubmodelBase>,
  ) {
  }

  static create(data: SubmodelBaseProps & {
    first: Reference;
    second: Reference;
    extensions?: Array<Extension>;
    annotations?: Array<ISubmodelBase>;
  }) {
    return new AnnotatedRelationshipElement(
      data.first,
      data.second,
      data.extensions ?? [],
      data.category ?? null,
      data.idShort,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.annotations ?? [],
    );
  }

  static fromPlain(data: unknown): ISubmodelBase {
    const parsed = AnnotatedRelationshipElementJsonSchema.parse(data);
    return AnnotatedRelationshipElement.create({
      ...submodelBasePropsFromPlain(parsed),
      first: Reference.fromPlain(parsed.first),
      second: Reference.fromPlain(parsed.second),
      extensions: parsed.extensions.map(e => Extension.fromPlain(e)),
      annotations: parsed.annotations.map(parseSubmodelBaseUnion),
    });
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitAnnotatedRelationshipElement(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }
}
