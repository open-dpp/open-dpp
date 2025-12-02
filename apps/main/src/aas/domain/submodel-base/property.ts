import { DataTypeDefType } from "../common/data-type-def";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { PropertyJsonSchema } from "../parsing/submodel-base/property-json-schema";
import { IVisitor } from "../visitor";
import { SubmodelBase, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class Property extends SubmodelBase {
  private constructor(
    public readonly valueType: DataTypeDefType,
    public readonly extensions: Extension[],
    category: string | null = null,
    idShort: string | null = null,
    displayName: LanguageText[],
    description: LanguageText[],
    semanticId: Reference | null = null,
    supplementalSemanticIds: Reference[],
    qualifiers: Qualifier[],
    embeddedDataSpecifications: EmbeddedDataSpecification[],
    public readonly value: string | null = null,
    public readonly valueId: Reference | null = null,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
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
      data.idShort ?? null,
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

  static fromPlain(data: Record<string, unknown>) {
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
}
