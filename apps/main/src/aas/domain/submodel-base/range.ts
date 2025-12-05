import { DataTypeDefType } from "../common/data-type-def";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../parsing/json-visitor";
import { RangeJsonSchema } from "../parsing/submodel-base/range-json-schema";
import { IVisitor } from "../visitor";
import { ISubmodelBase } from "./submodel";
import { SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class Range implements ISubmodelBase {
  private constructor(
    public readonly valueType: DataTypeDefType,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly min: string | null = null,
    public readonly max: string | null = null,
  ) {
  }

  static create(data: SubmodelBaseProps & {
    valueType: DataTypeDefType;
    extensions?: Array<Extension>;
    min?: string;
    max?: string;
  }) {
    return new Range(
      data.valueType,
      data.extensions ?? [],
      data.category ?? null,
      data.idShort,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.min ?? null,
      data.max ?? null,
    );
  }

  static fromPlain(data: unknown): ISubmodelBase {
    const parsed = RangeJsonSchema.parse(data);
    return Range.create({
      ...submodelBasePropsFromPlain(parsed),
      valueType: parsed.valueType,
      extensions: parsed.extensions.map(Extension.fromPlain),
      min: parsed.min,
      max: parsed.max,
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitRange(this);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }
}
