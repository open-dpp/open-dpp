import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { AnnotatedRelationshipElementJsonSchema } from "../parsing/submodel-base/annotated-relationship-element-json-schema";
import { IVisitor } from "../visitor";
import { IRelationshipElement } from "./relationship-element";
import { ISubmodelBase } from "./submodel";
import { parseSubmodelBaseUnion, SubmodelBase, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class AnnotatedRelationshipElement extends SubmodelBase implements IRelationshipElement {
  protected constructor(
    public readonly first: Reference,
    public readonly second: Reference,
    public readonly extensions: Array<Extension>,
    category: string | null = null,
    idShort: string | null = null,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    semanticId: Reference | null = null,
    supplementalSemanticIds: Array<Reference>,
    qualifiers: Qualifier[],
    embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly annotations: Array<ISubmodelBase>,
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
      data.idShort ?? null,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.annotations ?? [],
    );
  }

  static fromPlain(data: unknown): SubmodelBase {
    const parsed = AnnotatedRelationshipElementJsonSchema.parse(data);
    return AnnotatedRelationshipElement.create({
      ...submodelBasePropsFromPlain(parsed),
      first: Reference.fromPlain(parsed.first),
      second: Reference.fromPlain(parsed.second),
      extensions: parsed.extensions.map(e => Extension.fromPlain(e)),
      annotations: parsed.annotations.map(parseSubmodelBaseUnion),
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitAnnotatedRelationshipElement(this);
  }
}
