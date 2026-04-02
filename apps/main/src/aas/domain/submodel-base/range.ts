import { AasSubmodelElements, AasSubmodelElementsType, DataTypeDefType, RangeJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { IdShortPath } from "../common/id-short-path";
import { hasUniqueLanguagesOrFail, LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { ConvertToPlainOptions } from "../convertable-to-plain";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import JsonVisitor from "../json-visitor";
import { IVisitor } from "../visitor";
import { ISubmodelElement, SubmodelBaseProps, submodelBasePropsFromPlain } from "./submodel-base";

export class Range implements ISubmodelElement {
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private _parentIdShortPath: IdShortPath | undefined;

  private constructor(
    public readonly valueType: DataTypeDefType,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly min: string | null = null,
    public readonly max: string | null = null,
  ) {
    this.displayName = displayName;
    this.description = description;
  }

  setParentIdShortPath(parentIdShortPath: IdShortPath) {
    this._parentIdShortPath = parentIdShortPath;
  }

  getIdShortPath(): IdShortPath {
    return this._parentIdShortPath ? this._parentIdShortPath.addPathSegment(this.idShort) : IdShortPath.create({ path: this.idShort });
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
    valueType: DataTypeDefType;
    extensions?: Array<Extension>;
    min?: string | null;
    max?: string | null;
  }) {
    return new Range(
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
      data.min ?? null,
      data.max ?? null,
    );
  }

  static fromPlain(data: unknown): ISubmodelElement {
    const parsed = RangeJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new Range(
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
      parsed.min,
      parsed.max,
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitRange(this, context);
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor, options?.context);
  }

  getSubmodelElements(): ISubmodelElement[] {
    return [];
  }

  addSubmodelElement(_submodelElement: ISubmodelElement): ISubmodelElement {
    throw new ValueError("Range cannot contain submodel elements");
  }

  deleteSubmodelElement(_idShort: string) {
    throw new ValueError("Range does not support to delete submodel elements");
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.Range;
  }
}
