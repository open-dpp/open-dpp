import { DataTypeDef } from "../common/data-type-def";
import { KeyTypes } from "../common/key";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { IVisitor } from "../visitor";
import { SubmodelElementListJsonSchema } from "../zod-schemas";
import { AasSubmodelElements } from "./aas-submodel-elements";
import { ISubmodelBase } from "./submodel";
import { parseSubmodelBaseUnion, SubmodelBase, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";
import { registerSubmodel } from "./submodel-registry";

export class SubmodelElementList extends SubmodelBase {
  private constructor(
    public readonly typeValueListElement: AasSubmodelElements,
    public readonly extensions: Array<Extension>,
    category: string | null = null,
    idShort: string | null = null,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    semanticId: Reference | null = null,
    supplementalSemanticIds: Array<Reference>,
    qualifiers: Qualifier[],
    embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly orderRelevant: boolean | null = null,
    public readonly semanticIdListElement: Reference | null = null,
    public readonly valueTypeListElement: DataTypeDef | null = null,
    public readonly value: Array<ISubmodelBase>,
  ) {
    super(category, idShort, displayName, description, semanticId, supplementalSemanticIds, qualifiers, embeddedDataSpecifications);
  }

  static create(data: SubmodelBaseProps & {
    typeValueListElement: AasSubmodelElements;
    extensions?: Array<Extension>;
    orderRelevant?: boolean;
    semanticIdListElement?: Reference;
    valueTypeListElement?: DataTypeDef;
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

  static fromPlain(data: Record<string, unknown>): SubmodelBase {
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

registerSubmodel(KeyTypes.SubmodelElementList, SubmodelElementList);
