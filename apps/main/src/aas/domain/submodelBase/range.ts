import { DataTypeDefType } from "../common/data-type-def";
import { KeyTypes } from "../common/key-types-enum";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { RangeJsonSchema } from "../parsing/aas-json-schemas";
import { IVisitor } from "../visitor";
import { SubmodelBase, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";
import { registerSubmodel } from "./submodel-registry";

export class Range extends SubmodelBase {
  private constructor(
    public readonly valueType: DataTypeDefType,
    public readonly extensions: Array<Extension>,
    category: string | null = null,
    idShort: string | null = null,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    semanticId: Reference | null = null,
    supplementalSemanticIds: Array<Reference>,
    qualifiers: Array<Qualifier>,
    embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly min: string | null = null,
    public readonly max: string | null = null,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
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
      data.idShort ?? null,
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

  static fromPlain(data: Record<string, unknown>): SubmodelBase {
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
}

registerSubmodel(KeyTypes.Range, Range);
