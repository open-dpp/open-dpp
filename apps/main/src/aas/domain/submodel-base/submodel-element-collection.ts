import { ValueError } from "@open-dpp/exception";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../parsing/json-visitor";
import { SubmodelElementCollectionJsonSchema } from "../parsing/submodel-base/submodel-element-collection-json-schema";
import { IVisitor } from "../visitor";
import { AasSubmodelElements, AasSubmodelElementsType } from "./aas-submodel-elements";
import {
  ISubmodelElement,
  parseSubmodelBaseUnion,
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

  addSubmodelElement(submodelElement: ISubmodelElement): ISubmodelElement {
    if (this.value.some(s => s.idShort === submodelElement.idShort)) {
      throw new ValueError(`Submodel element with idShort ${submodelElement.idShort} already exists`);
    }
    this.value.push(submodelElement);
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
      parsed.value.map(parseSubmodelBaseUnion),
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitSubmodelElementCollection(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }

  * getSubmodelElements(): IterableIterator<ISubmodelElement> {
    yield* this.value;
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.SubmodelElementCollection;
  }
}
