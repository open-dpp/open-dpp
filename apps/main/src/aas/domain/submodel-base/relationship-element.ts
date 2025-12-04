import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { RelationshipElementJsonSchema } from "../parsing/submodel-base/relationship-element-json-schema";
import { IVisitor } from "../visitor";
import { ISubmodelBase } from "./submodel";
import { SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class IRelationshipElement {
  first: Reference;
  second: Reference;
}

export class RelationshipElement implements ISubmodelBase, IRelationshipElement {
  constructor(
    public readonly first: Reference,
    public readonly second: Reference,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string | null,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
  ) {

  }

  static create(
    data: SubmodelBaseProps & {
      first: Reference;
      second: Reference;
      extensions?: Array<Extension>;
    },
  ) {
    return new RelationshipElement(
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
    );
  }

  static fromPlain(data: unknown): ISubmodelBase {
    const parsed = RelationshipElementJsonSchema.parse(data);
    return RelationshipElement.create({
      ...submodelBasePropsFromPlain(parsed),
      first: Reference.fromPlain(parsed.first),
      second: Reference.fromPlain(parsed.second),
      extensions: parsed.extensions.map(e => Extension.fromPlain(e)),
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitRelationshipElement(this);
  }
}
