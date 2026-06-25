import {
  AasSubmodelElements,
  AasSubmodelElementsType,
  KeyTypes,
  KeyTypesType,
  SubmodelElementCollectionJsonSchema,
} from "@open-dpp/dto";
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
  copySubmodelElement,
  DeleteOptions,
  deleteSubmodelElementOrFail,
  ISubmodelElement,
  parseSubmodelElement,
  SubmodelBaseProps,
  submodelBasePropsFromPlain,
} from "./submodel-base";
import { Pointer } from "./pointer";
import { ICopyOptions } from "../copy-options";
import { AccessResult } from "../security/access-allowed";

export class SubmodelElementCollection implements ISubmodelElement {
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private _parentPointer = Pointer.create({});

  private constructor(
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    private value: Array<ISubmodelElement>,
  ) {
    this.displayName = displayName;
    this.description = description;
  }

  setParentPointer(parentPointer: Pointer): void {
    this._parentPointer = parentPointer;
    this._parentPointer.setParentPointersOfSubmodelElements(this);
  }

  getPointer(): Pointer {
    return this._parentPointer.getPointerToElement(this);
  }

  getIdShortPath(): IdShortPath {
    return this._parentPointer.getIdShortPathToElement(this);
  }

  getReference(): Reference {
    return this._parentPointer.getReferenceToElement(this);
  }

  getKeyType(): KeyTypesType {
    return KeyTypes.SubmodelElementCollection;
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

  static create(
    data: SubmodelBaseProps & {
      extensions?: Array<Extension>;
      value?: Array<ISubmodelElement>;
    },
  ) {
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
  }

  addSubmodelElement(submodelElement: ISubmodelElement, options: AddOptions): ISubmodelElement {
    return addSubmodelElementOrFail(this, submodelElement, options);
  }

  static fromPlain(data: unknown): SubmodelElementCollection {
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

  copy(options?: ICopyOptions): AccessResult<ISubmodelElement> {
    const submodelElementsCopy = this.value
      .map((se) => se.copy(options))
      .filter((se) => se.isAllowed)
      .map((se) => se.value.toPlain(options));
    return copySubmodelElement(this, {
      ...options,
      override: { value: submodelElementsCopy },
    });
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor, options?.context);
  }

  setSubmodelElements(submodelElements: Array<ISubmodelElement>): void {
    this.value = submodelElements;
  }

  getSubmodelElements(): ISubmodelElement[] {
    return this.value;
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.SubmodelElementCollection;
  }

  deleteSubmodelElement(idShort: string, options: DeleteOptions): ISubmodelElement {
    return deleteSubmodelElementOrFail(this.value, idShort, options);
  }
}
