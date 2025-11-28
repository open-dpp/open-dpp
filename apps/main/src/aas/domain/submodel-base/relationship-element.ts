import { KeyTypes } from "../common/key-types-enum";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { RelationshipElementJsonSchema } from "../parsing/submodel-base/relationship-element-json-schema";
import { IVisitor } from "../visitor";
import { SubmodelBase, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";
import { registerSubmodel } from "./submodel-registry";

export class IRelationshipElement {
  first: Reference;
  second: Reference;
}

export class RelationshipElement extends SubmodelBase implements IRelationshipElement {
  constructor(
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

  static fromPlain(data: Record<string, unknown>): SubmodelBase {
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

registerSubmodel(KeyTypes.RelationshipElement, RelationshipElement);
