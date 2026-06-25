import {
  AasSubmodelElements,
  AasSubmodelElementsType,
  EntityTypeJsonSchema,
  EntityTypeType,
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
import { SpecificAssetId } from "../specific-asset-id";
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

export class Entity implements ISubmodelElement {
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private _parentPointer = Pointer.create({});

  private constructor(
    public readonly entityType: EntityTypeType,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    private statements: Array<ISubmodelElement>,
    public readonly globalAssetId: string | null = null,
    public readonly specificAssetIds: Array<SpecificAssetId>,
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
    return KeyTypes.Entity;
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
      entityType: EntityTypeType;
      extensions?: Array<Extension>;
      statements?: Array<ISubmodelElement>;
      globalAssetId?: string | null;
      specificAssetIds?: Array<SpecificAssetId>;
    },
  ) {
    return new Entity(
      data.entityType,
      data.extensions ?? [],
      data.category ?? null,
      data.idShort,
      data.displayName ?? [],
      data.description ?? [],
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.qualifiers ?? [],
      data.embeddedDataSpecifications ?? [],
      data.statements ?? [],
      data.globalAssetId ?? null,
      data.specificAssetIds ?? [],
    );
  }

  static fromPlain(data: unknown): ISubmodelElement {
    const parsed = EntityTypeJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new Entity(
      parsed.entityType,
      parsed.extensions.map((e) => Extension.fromPlain(e)),
      baseObjects.category,
      baseObjects.idShort,
      baseObjects.displayName,
      baseObjects.description,
      baseObjects.semanticId,
      baseObjects.supplementalSemanticIds,
      baseObjects.qualifiers,
      baseObjects.embeddedDataSpecifications,
      parsed.statements.map(parseSubmodelElement),
      parsed.globalAssetId,
      parsed.specificAssetIds.map((s) => SpecificAssetId.fromPlain(s)),
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitEntity(this, context);
  }

  copy(options?: ICopyOptions): AccessResult<ISubmodelElement> {
    return copySubmodelElement(this, options);
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor, options?.context);
  }

  setSubmodelElements(submodelElements: Array<ISubmodelElement>): void {
    this.statements = submodelElements;
    this.getSubmodelElements().forEach((se) => {
      se.setParentPointer(this.getPointer());
    });
  }

  getSubmodelElements(): ISubmodelElement[] {
    return this.statements;
  }

  addSubmodelElement(submodelElement: ISubmodelElement, options: AddOptions): ISubmodelElement {
    return addSubmodelElementOrFail(this, submodelElement, options);
  }

  deleteSubmodelElement(idShort: string, options: DeleteOptions): ISubmodelElement {
    return deleteSubmodelElementOrFail(this.statements, idShort, options);
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.Entity;
  }
}
