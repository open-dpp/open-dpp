import { AasSubmodelElements, AasSubmodelElementsType, DataTypeDefType, SubmodelElementListJsonSchema } from "@open-dpp/dto";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../json-visitor";
import { IVisitor } from "../visitor";
import {
  AddOptions,
  deleteSubmodelElementOrFail,
  ISubmodelElement,
  parseSubmodelElement,
  SubmodelBaseProps,
  submodelBasePropsFromPlain,
} from "./submodel-base";

export class SubmodelElementList implements ISubmodelElement {
  private constructor(
    public readonly typeValueListElement: AasSubmodelElementsType,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly orderRelevant: boolean | null = null,
    public readonly semanticIdListElement: Reference | null = null,
    public readonly valueTypeListElement: DataTypeDefType | null = null,
    public readonly value: Array<ISubmodelElement>,
  ) {
  }

  static create(data: SubmodelBaseProps & {
    typeValueListElement: AasSubmodelElementsType;
    extensions?: Array<Extension>;
    orderRelevant?: boolean | null;
    semanticIdListElement?: Reference | null;
    valueTypeListElement?: DataTypeDefType | null;
    value?: Array<ISubmodelElement>;
  }) {
    return new SubmodelElementList(
      data.typeValueListElement,
      data.extensions ?? [],
      data.category ?? null,
      data.idShort,
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

  static fromPlain(data: unknown): ISubmodelElement {
    const parsed = SubmodelElementListJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new SubmodelElementList(
      parsed.typeValueListElement,
      parsed.extensions.map(Extension.fromPlain),
      baseObjects.category,
      baseObjects.idShort,
      baseObjects.displayName,
      baseObjects.description,
      baseObjects.semanticId,
      baseObjects.supplementalSemanticIds,
      baseObjects.qualifiers,
      baseObjects.embeddedDataSpecifications,
      parsed.orderRelevant,
      parsed.semanticIdListElement ? Reference.fromPlain(parsed.semanticIdListElement) : null,
      parsed.valueTypeListElement,
      parsed.value.map(parseSubmodelElement),
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitSubmodelElementList(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }

  getSubmodelElements(): ISubmodelElement[] {
    return this.value;
  }

  addSubmodelElement(submodelElement: ISubmodelElement, options?: AddOptions): ISubmodelElement {
    if (this.value.some(s => s.idShort === submodelElement.idShort)) {
      throw new Error(`Submodel element with idShort ${submodelElement.idShort} already exists`);
    }
    if (submodelElement.getSubmodelElementType() !== this.typeValueListElement) {
      throw new Error(`Submodel element type ${submodelElement.getSubmodelElementType()} does not match list type ${this.typeValueListElement}`);
    }

    if (options?.position !== undefined) {
      this.value.splice(options.position, 0, submodelElement);
    }
    else {
      this.value.push(submodelElement);
    }
    return submodelElement;
  }

  deleteSubmodelElement(idShort: string) {
    deleteSubmodelElementOrFail(this.value, idShort);
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.SubmodelElementList;
  }
}
