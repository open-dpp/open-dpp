import { Buffer } from "node:buffer";
import { AasSubmodelElements, AasSubmodelElementsType, BlobJsonSchema } from "@open-dpp/dto";
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

export class Blob implements ISubmodelElement {
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private _parentIdShortPath: IdShortPath | undefined;

  private constructor(
    public readonly contentType: string,
    public readonly extensions: Array<Extension>,
    public readonly category: string | null,
    public readonly idShort: string,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    public readonly value: Buffer | null = null,
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
    contentType: string;
    extensions?: Array<Extension>;
    value?: Buffer | null;
  }) {
    return new Blob(
      data.contentType,
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
    );
  }

  static fromPlain(data: unknown): ISubmodelElement {
    const parsed = BlobJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new Blob(
      parsed.contentType,
      parsed.extensions.map(e => Extension.fromPlain(e)),
      baseObjects.category,
      baseObjects.idShort,
      baseObjects.displayName,
      baseObjects.description,
      baseObjects.semanticId,
      baseObjects.supplementalSemanticIds,
      baseObjects.qualifiers,
      baseObjects.embeddedDataSpecifications,
      parsed.value ? Buffer.from(parsed.value) : undefined,
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitBlob(this, context);
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor, options?.context);
  }

  getSubmodelElements(): ISubmodelElement[] {
    return [];
  }

  addSubmodelElement(_submodelElement: ISubmodelElement): ISubmodelElement {
    throw new ValueError("Blob cannot contain submodel elements");
  }

  deleteSubmodelElement(_idShort: string) {
    throw new ValueError("Blob does not support to delete submodel elements");
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.Blob;
  }
}
