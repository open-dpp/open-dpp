import { AasSubmodelElements, AasSubmodelElementsType, AnnotatedRelationshipElementJsonSchema } from "@open-dpp/dto";
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
  DeleteOptions,
  deleteSubmodelElementOrFail,
  ISubmodelElement,
  parseSubmodelElement,
  setParentIdShortPaths,
  SubmodelBaseProps,
  submodelBasePropsFromPlain,
} from "./submodel-base";

export class AnnotatedRelationshipElement implements ISubmodelElement, IRelationshipElement {
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private _parentIdShortPath: IdShortPath | undefined;

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

  setParentIdShortPath(parentIdShortPath: IdShortPath) {
    this._parentIdShortPath = parentIdShortPath;
    setParentIdShortPaths(this, this.idShort, this._parentIdShortPath);
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
    first: Reference;
    second: Reference;
    extensions?: Array<Extension>;
    annotations?: Array<ISubmodelElement>;
  }) {
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
      parsed.extensions.map(e => Extension.fromPlain(e)),
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

  deleteSubmodelElement(idShort: string, options: DeleteOptions) {
    deleteSubmodelElementOrFail(this.annotations, idShort, options);
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.AnnotatedRelationshipElement;
  }
}
