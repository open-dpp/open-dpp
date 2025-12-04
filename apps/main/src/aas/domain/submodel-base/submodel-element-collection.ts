import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { SubmodelElementCollectionJsonSchema } from "../parsing/submodel-base/submodel-element-collection-json-schema";
import { IVisitor } from "../visitor";
import { ISubmodelBase } from "./submodel";
import { parseSubmodelBaseUnion, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class SubmodelElementCollection implements ISubmodelBase {
  private constructor(
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string | null,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly value: Array<ISubmodelBase>,
  ) {
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

  static fromPlain(data: unknown): ISubmodelBase {
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
