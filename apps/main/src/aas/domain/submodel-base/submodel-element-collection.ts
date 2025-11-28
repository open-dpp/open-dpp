import { KeyTypes } from "../common/key-types-enum";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { SubmodelElementCollectionJsonSchema } from "../parsing/submodel-base/submodel-element-collection-json-schema";
import { IVisitor } from "../visitor";
import { ISubmodelBase } from "./submodel";
import { parseSubmodelBaseUnion, SubmodelBase, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";
import { registerSubmodel } from "./submodel-registry";

export class SubmodelElementCollection extends SubmodelBase {
  private constructor(
    public readonly extensions: Array<Extension>,
    category: string | null = null,
    idShort: string | null = null,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    semanticId: Reference | null = null,
    supplementalSemanticIds: Array<Reference>,
    qualifiers: Qualifier[],
    embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly value: Array<ISubmodelBase>,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
  }

  static create(data: SubmodelBaseProps & {
    extensions?: Array<Extension>;
    value?: Array<ISubmodelBase>;
  }) {
    return new SubmodelElementCollection(
      data.extensions ?? [],
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.value ?? [],
    );
  };

  addSubmodelBase(submodelBase: ISubmodelBase) {
    this.value.push(submodelBase);
  }

  static fromPlain(data: Record<string, unknown>): SubmodelBase {
    const parsed = SubmodelElementCollectionJsonSchema.parse(data);
    return SubmodelElementCollection.create({
      ...submodelBasePropsFromPlain(parsed),
      extensions: parsed.extensions.map(Extension.fromPlain),
      value: parsed.value.map(parseSubmodelBaseUnion),
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitSubmodelElementCollection(this);
  }
}

registerSubmodel(KeyTypes.SubmodelElementCollection, SubmodelElementCollection);
