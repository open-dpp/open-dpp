import {
  AasSubmodelElements,
  AasSubmodelElementsType,
  AnnotatedRelationshipElementJsonSchema,
  KeyTypes,
  KeyTypesType,
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
import { IRelationshipElement } from "./relationship-element";
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

export class AnnotatedRelationshipElement implements ISubmodelElement, IRelationshipElement {
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private _parentPointer: Pointer = Pointer.create({});

  protected constructor(
    public readonly first: Reference,
    public readonly second: Reference,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly annotations: Array<ISubmodelElement>,
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
    return KeyTypes.AnnotatedRelationshipElement;
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

  static create(
    data: SubmodelBaseProps & {
      first: Reference;
      second: Reference;
      extensions?: Array<Extension>;
      annotations?: Array<ISubmodelElement>;
    },
  ) {
    return new AnnotatedRelationshipElement(
      data.first,
      data.second,
      data.extensions ?? [],
      data.category ?? null,
      data.idShort,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.annotations ?? [],
    );
  }

  static fromPlain(data: unknown): ISubmodelElement {
    const parsed = AnnotatedRelationshipElementJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new AnnotatedRelationshipElement(
      Reference.fromPlain(parsed.first),
      Reference.fromPlain(parsed.second),
      parsed.extensions.map((e) => Extension.fromPlain(e)),
      baseObjects.category,
      baseObjects.idShort,
      baseObjects.displayName,
      baseObjects.description,
      baseObjects.semanticId,
      baseObjects.supplementalSemanticIds,
      baseObjects.qualifiers,
      baseObjects.embeddedDataSpecifications,
      parsed.annotations.map(parseSubmodelElement),
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitAnnotatedRelationshipElement(this, context);
  }

  copy(options?: ICopyOptions): ISubmodelElement {
    return copySubmodelElement(this, options);
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor, options?.context);
  }

  getSubmodelElements(): ISubmodelElement[] {
    return this.annotations;
  }

  addSubmodelElement(submodelElement: ISubmodelElement, options: AddOptions): ISubmodelElement {
    return addSubmodelElementOrFail(this, submodelElement, options);
  }

  deleteSubmodelElement(idShort: string, options: DeleteOptions): ISubmodelElement {
    return deleteSubmodelElementOrFail(this.annotations, idShort, options);
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.AnnotatedRelationshipElement;
  }
}
