import { DataTypeDefType } from "../common/data-type-def";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { SubmodelElementListJsonSchema } from "../parsing/submodel-base/submodel-element-list-json-schema";
import { IVisitor } from "../visitor";
import { AasSubmodelElementsType } from "./aas-submodel-elements";
import { ISubmodelBase } from "./submodel";
import { parseSubmodelBaseUnion, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class SubmodelElementList implements ISubmodelBase {
  private constructor(
    public readonly typeValueListElement: AasSubmodelElementsType,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string | null,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly orderRelevant: boolean | null = null,
    public readonly semanticIdListElement: Reference | null = null,
    public readonly valueTypeListElement: DataTypeDefType | null = null,
    public readonly value: Array<ISubmodelBase>,
  ) {
  }

  static create(data: SubmodelBaseProps & {
    typeValueListElement: AasSubmodelElementsType;
    extensions?: Array<Extension>;
    orderRelevant?: boolean;
    semanticIdListElement?: Reference;
    valueTypeListElement?: DataTypeDefType;
    value?: Array<ISubmodelBase>;
  }) {
    return new SubmodelElementList(
      data.typeValueListElement,
      data.extensions ?? [],
      data.category ?? null,
      data.idShort ?? null,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.orderRelevant ?? null,
      data.semanticIdListElement ?? null,
      data.valueTypeListElement ?? null,
      data.value ?? [],
    );
  }

  static fromPlain(data: unknown): ISubmodelBase {
    const parsed = SubmodelElementListJsonSchema.parse(data);
    return SubmodelElementList.create({
      ...submodelBasePropsFromPlain(parsed),
      typeValueListElement: parsed.typeValueListElement,
      extensions: parsed.extensions.map(Extension.fromPlain),
      orderRelevant: parsed.orderRelevant,
      semanticIdListElement: parsed.semanticIdListElement ? Reference.fromPlain(parsed.semanticIdListElement) : undefined,
      valueTypeListElement: parsed.valueTypeListElement,
      value: parsed.value.map(parseSubmodelBaseUnion),
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitSubmodelElementList(this);
  }
}
