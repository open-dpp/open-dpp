import { DataTypeDefType } from "../common/data-type-def";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../parsing/json-visitor";
import { PropertyJsonSchema } from "../parsing/submodel-base/property-json-schema";
import { IVisitor } from "../visitor";
import { ISubmodelBase } from "./submodel";
import { SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class Property implements ISubmodelBase {
  private constructor(
    public readonly valueType: DataTypeDefType,
    public readonly extensions: Extension[],
    public readonly category: string | null,
    public readonly idShort: string,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly value: string | null = null,
    public readonly valueId: Reference | null = null,
  ) {
  }

  static create(data: SubmodelBaseProps & {
    valueType: DataTypeDefType;
    extensions?: Extension[];
    value?: string;
    valueId?: Reference;
  }) {
    return new Property(
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
      data.value ?? null,
      data.valueId ?? null,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = PropertyJsonSchema.parse(data);
    return Property.create({
      ...submodelBasePropsFromPlain(parsed),
      valueType: parsed.valueType,
      extensions: parsed.extensions.map(Extension.fromPlain),
      value: parsed.value,
      valueId: parsed.valueId ? Reference.fromPlain(parsed.valueId) : undefined,
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitProperty(this);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }
}
