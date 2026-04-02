import { AasSubmodelElements, AasSubmodelElementsType, SubmodelElementCollectionJsonSchema } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
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
  DeleteOptions,
  deleteSubmodelElementOrFail,
  IdShortPath,
  ISubmodelElement,
  parseSubmodelElement,
  setParentIdShortPaths,
  SubmodelBaseProps,
  submodelBasePropsFromPlain,
} from "./submodel-base";

export class SubmodelElementCollection implements ISubmodelElement {
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private _parentIdShortPath: IdShortPath | undefined;

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
    public readonly value: Array<ISubmodelElement>,
  ) {
    this.displayName = displayName;
    this.description = description;
  }

  setParentIdShortPath(parentIdShortPath: IdShortPath) {
    this._parentIdShortPath = parentIdShortPath;
    setParentIdShortPaths(this, this.idShort, this._parentIdShortPath);
  }

  getIdShortPath(): IdShortPath {
    return this._parentIdShortPath ? this._parentIdShortPath.addPathSegment(this.idShort) : IdShortPath.create({ path: this.idShort });
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
    submodelElement.setParentIdShortPath(this.getIdShortPath());

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

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor, options?.context);
  }

  getSubmodelElements(): ISubmodelElement[] {
    return this.value;
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.SubmodelElementCollection;
  }

  deleteSubmodelElement(idShort: string, options: DeleteOptions) {
    deleteSubmodelElementOrFail(this.value, idShort, options);
  }
}
