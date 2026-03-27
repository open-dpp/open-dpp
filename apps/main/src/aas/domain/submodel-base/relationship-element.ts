import { AasSubmodelElements, AasSubmodelElementsType, RelationshipElementJsonSchema } from "@open-dpp/dto";
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

export class IRelationshipElement {
  first: Reference;
  second: Reference;
}

export class RelationshipElement implements ISubmodelElement, IRelationshipElement {
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  constructor(
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

  static create(
    data: SubmodelBaseProps & {
      first: Reference;
      second: Reference;
      extensions?: Array<Extension>;
    },
  ) {
    return new RelationshipElement(
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
    );
  }

  static fromPlain(data: unknown): ISubmodelElement {
    const parsed = RelationshipElementJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new RelationshipElement(
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
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitRelationshipElement(this, context);
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor);
  }

  getSubmodelElements(): ISubmodelElement[] {
    return [];
  }

  addSubmodelElement(_submodelElement: ISubmodelElement): ISubmodelElement {
    throw new ValueError("RelationshipElement cannot contain submodel elements");
  }

  deleteSubmodelElement(_idShort: string) {
    throw new ValueError("RelationshipElement does not support to delete submodel elements");
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.RelationshipElement;
  }
}
