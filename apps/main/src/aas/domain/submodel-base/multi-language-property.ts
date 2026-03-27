import { AasSubmodelElements, AasSubmodelElementsType, MultiLanguagePropertyJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { hasUniqueLanguagesOrFail, LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { ConvertToPlainOptions } from "../convertable-to-plain";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import JsonVisitor from "../json-visitor";
import { IVisitor } from "../visitor";
import { ISubmodelElement, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class MultiLanguageProperty implements ISubmodelElement {
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private constructor(
    public readonly extensions: Extension[],
    public readonly category: string | null,
    public readonly idShort: string,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public value: LanguageText[],
    public readonly valueId: Reference | null = null,
  ) {
    this.displayName = displayName;
    this.description = description;
  }

  set displayName(value: Array<LanguageText>) {
    hasUniqueLanguagesOrFail(value);
    this._displayName = value;
  }

  get displayName(): Array<LanguageText> {
    return this._displayName;
  }

  set description(value: Array<LanguageText>) {
    hasUniqueLanguagesOrFail(value);
    this._description = value;
  }

  get description(): Array<LanguageText> {
    return this._description;
  }

  static create(data: SubmodelBaseProps & {
    extensions?: Extension[];
    value?: LanguageText[];
    valueId?: Reference | null;
  }) {
    return new MultiLanguageProperty(
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
      data.valueId ?? null,
    );
  }

  static fromPlain(data: unknown): ISubmodelElement {
    const parsed = MultiLanguagePropertyJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new MultiLanguageProperty(
      parsed.extensions.map(e => Extension.fromPlain(e)),
      baseObjects.category,
      baseObjects.idShort,
      baseObjects.displayName,
      baseObjects.description,
      baseObjects.semanticId,
      baseObjects.supplementalSemanticIds,
      baseObjects.qualifiers,
      baseObjects.embeddedDataSpecifications,
      parsed.value.map(l => LanguageText.fromPlain(l)),
      parsed.valueId ? Reference.fromPlain(parsed.valueId) : undefined,
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitMultiLanguageProperty(this, context);
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor);
  }

  getSubmodelElements(): ISubmodelElement[] {
    return [];
  }

  addSubmodelElement(_submodelElement: ISubmodelElement): ISubmodelElement {
    throw new ValueError("MultiLanguageProperty cannot contain submodel elements");
  }

  deleteSubmodelElement(_idShort: string): void {
    throw new ValueError("MultiLanguageProperty does not support to delete submodel elements");
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.MultiLanguageProperty;
  }
}
