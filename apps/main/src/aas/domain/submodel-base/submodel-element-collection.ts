import { AasSubmodelElements, AasSubmodelElementsType, SubmodelElementCollectionJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
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

export class SubmodelElementCollection implements ISubmodelElement {
  private constructor(
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly value: Array<ISubmodelElement>,
  ) {
  }

  static create(data: SubmodelBaseProps & {
    extensions?: Array<Extension>;
    value?: Array<ISubmodelElement>;
  }) {
    return new SubmodelElementCollection(
      data.extensions ?? [],
      data.category ?? null,
      data.idShort,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.value ?? [],
    );
  };

  addSubmodelElement(submodelElement: ISubmodelElement, options?: AddOptions): ISubmodelElement {
    if (this.value.some(s => s.idShort === submodelElement.idShort)) {
      throw new ValueError(`Submodel element with idShort ${submodelElement.idShort} already exists`);
    }
    if (options?.position !== undefined) {
      this.value.splice(options.position, 0, submodelElement);
    }
    else {
      this.value.push(submodelElement);
    }
    return submodelElement;
  }

  static fromPlain(data: unknown): ISubmodelElement {
    const parsed = SubmodelElementCollectionJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new SubmodelElementCollection(
      parsed.extensions.map(Extension.fromPlain),
      baseObjects.category,
      baseObjects.idShort,
      baseObjects.displayName,
      baseObjects.description,
      baseObjects.semanticId,
      baseObjects.supplementalSemanticIds,
      baseObjects.qualifiers,
      baseObjects.embeddedDataSpecifications,
      parsed.value.map(parseSubmodelElement),
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitSubmodelElementCollection(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }

  getSubmodelElements(): ISubmodelElement[] {
    return this.value;
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.SubmodelElementCollection;
  }

  deleteSubmodelElement(idShort: string) {
    deleteSubmodelElementOrFail(this.value, idShort);
  }
}
