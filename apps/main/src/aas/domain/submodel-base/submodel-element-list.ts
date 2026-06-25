import {
  AasSubmodelElements,
  AasSubmodelElementsType,
  DataTypeDefType,
  KeyTypes,
  KeyTypesType,
  SubmodelElementListJsonSchema,
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

export class SubmodelElementList implements ISubmodelElement {
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private _parentPointer = Pointer.create({});

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
    private value: Array<ISubmodelElement>,
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

  static create(
    data: SubmodelBaseProps & {
      typeValueListElement: AasSubmodelElementsType;
      extensions?: Array<Extension>;
      orderRelevant?: boolean | null;
      semanticIdListElement?: Reference | null;
      valueTypeListElement?: DataTypeDefType | null;
      value?: Array<ISubmodelElement>;
    },
  ) {
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
    return KeyTypes.SubmodelElementList;
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitSubmodelElementList(this, context);
  }

  copy(options?: ICopyOptions): AccessResult<ISubmodelElement> {
    return copySubmodelElement(this, options);
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor, options?.context);
  }

  getSubmodelElements(): ISubmodelElement[] {
    return this.value;
  }

  hasParentList(): boolean {
    return (
      this.getReference().constructIdShortPathsForType(KeyTypes.SubmodelElementList).length > 1
    );
  }

  setSubmodelElements(submodelElements: Array<ISubmodelElement>): void {
    this.value = submodelElements;
    this.getSubmodelElements().forEach((se) => {
      se.setParentPointer(this.getPointer());
    });
  }

  addSubmodelElement(submodelElement: ISubmodelElement, options: AddOptions): ISubmodelElement {
    if (submodelElement.getSubmodelElementType() !== this.typeValueListElement) {
      throw new Error(
        `Submodel element type ${submodelElement.getSubmodelElementType()} does not match list type ${this.typeValueListElement}`,
      );
    }
    submodelElement.setParentPointer(this.getPointer());
    return addSubmodelElementOrFail(this, submodelElement, options);
  }

  deleteSubmodelElement(idShort: string, options: DeleteOptions): ISubmodelElement {
    return deleteSubmodelElementOrFail(this.value, idShort, options);
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.SubmodelElementList;
  }
}
