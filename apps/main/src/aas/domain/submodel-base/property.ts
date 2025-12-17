import { ValueError } from "@open-dpp/exception";
import { DataTypeDefType } from "../common/data-type-def";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import { JsonVisitor } from "../parsing/json-visitor";
import { PropertyJsonSchema } from "../parsing/submodel-base/property-json-schema";
import { IVisitor } from "../visitor";
import { AasSubmodelElements, AasSubmodelElementsType } from "./aas-submodel-elements";
import { ISubmodelElement, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class Property implements ISubmodelElement {
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
    value?: string | null;
    valueId?: Reference | null;
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

  static fromPlain(data: unknown): ISubmodelElement {
    const parsed = PropertyJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new Property(
      parsed.valueType,
      parsed.extensions.map(Extension.fromPlain),
      baseObjects.category,
      baseObjects.idShort,
      baseObjects.displayName,
      baseObjects.description,
      baseObjects.semanticId,
      baseObjects.supplementalSemanticIds,
      baseObjects.qualifiers,
      baseObjects.embeddedDataSpecifications,
      parsed.value,
      parsed.valueId ? Reference.fromPlain(parsed.valueId) : undefined,
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitProperty(this, context);
  }

  toPlain(): Record<string, any> {
    const jsonVisitor = new JsonVisitor();
    return this.accept(jsonVisitor);
  }

  * getSubmodelElements(): IterableIterator<ISubmodelElement> {
    yield* [];
  }

  addSubmodelElement(_submodelElement: ISubmodelElement): ISubmodelElement {
    throw new ValueError("Property cannot contain submodel elements");
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.Property;
  }
}
