import {
  AasSubmodelElements,
  AasSubmodelElementsType,
  DataTypeDef,
  DataTypeDefType,
  PropertyJsonSchema,
} from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { z } from "zod";
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

export class Property implements ISubmodelElement {
  private _value: string | null = null;
  private _displayName: Array<LanguageText>;
  private _description: Array<LanguageText>;
  private _parentIdShortPath: IdShortPath | undefined;

  private constructor(
    public readonly valueType: DataTypeDefType,
    public readonly extensions: Extension[],
    public readonly category: string | null,
    public readonly idShort: string,
    displayName: Array<LanguageText>,
    description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
    value: string | null = null,
    public readonly valueId: Reference | null = null,
  ) {
    this.value = value;
    this.displayName = displayName;
    this.description = description;
  }

  setParentIdShortPath(parentIdShortPath: IdShortPath) {
    this._parentIdShortPath = parentIdShortPath;
  }

  getIdShortPath(): IdShortPath {
    return this._parentIdShortPath
      ? this._parentIdShortPath.addPathSegment(this.idShort)
      : IdShortPath.create({ path: this.idShort });
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
      valueType: DataTypeDefType;
      extensions?: Extension[];
      value?: string | null;
      valueId?: Reference | null;
    },
  ) {
    return new Property(
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
      data.value ?? null,
      data.valueId ?? null,
    );
  }

  private validateValue(value: string | null, valueType: DataTypeDefType): void {
    function parse(schema: z.ZodSchema): void {
      const result = schema.safeParse(value);
      if (!result.success) {
        throw new ValueError(
          `Invalid value for valueType ${valueType}: ${z.flattenError(result.error).formErrors[0]}`,
        );
      }
    }
    if (value !== null) {
      if ([DataTypeDef.Double, DataTypeDef.Float].find((n) => n === valueType)) {
        parse(z.coerce.number());
      } else if (valueType === DataTypeDef.DateTime) {
        // Require ISO-8601 with an explicit timezone offset so the value
        // represents an unambiguous instant. A naive "2026-04-10T14:00:00"
        // would render differently for users in different timezones.
        parse(z.iso.datetime({ offset: true }));
      } else {
        parse(z.string());
      }
    }
  }

  set value(value: string | null) {
    this.validateValue(value, this.valueType);
    this._value = value;
  }

  get value(): string | null {
    return this._value;
  }

  static fromPlain(data: unknown): ISubmodelElement {
    const parsed = PropertyJsonSchema.parse(data);
    const baseObjects = submodelBasePropsFromPlain(parsed);
    return new Property(
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
      parsed.value,
      parsed.valueId ? Reference.fromPlain(parsed.valueId) : undefined,
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitProperty(this, context);
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    const jsonVisitor = new JsonVisitor(options);
    return this.accept(jsonVisitor, options?.context);
  }

  getSubmodelElements(): ISubmodelElement[] {
    return [];
  }

  addSubmodelElement(_submodelElement: ISubmodelElement): ISubmodelElement {
    throw new ValueError("Property cannot contain submodel elements");
  }

  deleteSubmodelElement(_idShort: string) {
    throw new ValueError("Property does not support to delete submodel elements");
  }

  getSubmodelElementType(): AasSubmodelElementsType {
    return AasSubmodelElements.Property;
  }
}
