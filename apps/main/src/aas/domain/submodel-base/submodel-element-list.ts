import { AasSubmodelElements, AasSubmodelElementsType, DataTypeDefType, SubmodelElementListJsonSchema } from "@open-dpp/dto";
import { IdShortPath } from "../common/id-short-path";
import { hasUniqueLanguagesOrFail, LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { ConvertToPlainOptions } from "../convertable-to-plain";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { Extension } from "../extension";
import JsonVisitor from "../json-visitor";
import { IVisitor } from "../visitor";
import {
  AddOptions,
  addSubmodelElementOrFail,
  DeleteOptions,
  deleteSubmodelElementOrFail,
  ISubmodelElement,
  parseSubmodelElement,
  setParentIdShortPaths,
  SubmodelBaseProps,
  submodelBasePropsFromPlain,
} from "./submodel-base";

export class SubmodelElementList implements ISubmodelElement {
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private _parentIdShortPath: IdShortPath | undefined;

  private constructor(
    public readonly typeValueListElement: AasSubmodelElementsType,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly orderRelevant: boolean | null = null,
    public readonly semanticIdListElement: Reference | null = null,
    public readonly valueTypeListElement: DataTypeDefType | null = null,
    public readonly value: Array<ISubmodelElement>,
  ) {
    this.displayName = displayName;
    this.description = description;
  }

  set displayName(value: Array<LanguageText>) {
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

  setParentIdShortPath(parentIdShortPath: IdShortPath) {
    this._parentIdShortPath = parentIdShortPath;
    setParentIdShortPaths(this, this.idShort, this._parentIdShortPath);
  }

  getIdShortPath(): IdShortPath {
    return this._parentIdShortPath ? this._parentIdShortPath.addPathSegment(this.idShort) : IdShortPath.create({ path: this.idShort });
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitSubmodelElementList(this, context);
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor, options?.context);
  }

  getSubmodelElements(): ISubmodelElement[] {
    return this.value;
  }

  addSubmodelElement(submodelElement: ISubmodelElement, options: AddOptions): ISubmodelElement {
    if (submodelElement.getSubmodelElementType() !== this.typeValueListElement) {
      throw new Error(`Submodel element type ${submodelElement.getSubmodelElementType()} does not match list type ${this.typeValueListElement}`);
    }
    submodelElement.setParentIdShortPath(this.getIdShortPath());
    return addSubmodelElementOrFail(this, submodelElement, options);
  }

  deleteSubmodelElement(idShort: string, options: DeleteOptions) {
    deleteSubmodelElementOrFail(this.value, idShort, options);
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.SubmodelElementList;
  }
}
