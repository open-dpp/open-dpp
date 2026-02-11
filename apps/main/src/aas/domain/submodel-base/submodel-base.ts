import {
  AasSubmodelElementsType,
  KeyTypesEnum,
  SubmodelBaseJsonSchema,
} from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { z } from "zod";
import { IHasDataSpecification } from "../common/has-data-specification";
import { IHasSemantics } from "../common/has-semantics";
import { LanguageText } from "../common/language-text";
import { IQualifiable, Qualifier } from "../common/qualififiable";
import { IReferable } from "../common/referable";
import { Reference } from "../common/reference";
import { IConvertableToPlain } from "../convertable-to-plain";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { IVisitable } from "../visitor";
import { getSubmodelClass } from "./submodel-registry";

export interface SubmodelBaseProps {
  category?: string | null;
  idShort: string;
  displayName?: Array<LanguageText>;
  description?: Array<LanguageText>;
  semanticId?: Reference | null;
  supplementalSemanticIds?: Array<Reference>;
  qualifiers?: Array<Qualifier>;
  embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
}

export interface SubmodelBaseObjects extends IReferable, IHasSemantics, IQualifiable, IHasDataSpecification {
}

export function submodelBasePropsFromPlain(data: Record<string, unknown>): SubmodelBaseObjects {
  const parsed = SubmodelBaseJsonSchema.parse(data);
  return {
    category: parsed.category ?? null,
    idShort: parsed.idShort,
    displayName: parsed.displayName.map(x => LanguageText.fromPlain(x)),
    description: parsed.description.map(x => LanguageText.fromPlain(x)),
    semanticId: parsed.semanticId ? Reference.fromPlain(parsed.semanticId) : null,
    supplementalSemanticIds: parsed.supplementalSemanticIds.map(x => Reference.fromPlain(x)),
    qualifiers: parsed.qualifiers.map(q => Qualifier.fromPlain(q)),
    embeddedDataSpecifications: parsed.embeddedDataSpecifications.map(e => EmbeddedDataSpecification.fromPlain(e)),
  };
}

export class IdShortPath {
  constructor(private readonly _segments: Array<string>) {
  }

  static create(data: { path: string }): IdShortPath {
    return new IdShortPath(data.path.split("."));
  }

  addPathSegment(segment: string) {
    this._segments.push(segment);
  }

  getParentPath(): IdShortPath {
    return new IdShortPath(this._segments.slice(0, -1));
  }

  get last(): string | undefined {
    if (this._segments.length === 0) {
      return undefined;
    }
    return this._segments[this._segments.length - 1];
  }

  get segments(): IterableIterator<string> {
    return this._segments[Symbol.iterator]();
  }

  toString(): string {
    return this._segments.join(".");
  }
}

export interface AddOptions {
  idShortPath?: IdShortPath;
  position?: number;
}

export interface ISubmodelBase
  extends SubmodelBaseObjects,
  IVisitable,
  IConvertableToPlain {
  addSubmodelElement: (submodelElement: ISubmodelElement, options?: AddOptions) => ISubmodelElement;
  getSubmodelElements: () => ISubmodelElement[];
}

export interface ISubmodelElement extends ISubmodelBase {
  getSubmodelElementType: () => AasSubmodelElementsType;
  deleteSubmodelElement: (idShort: string) => void;
}

export function parseSubmodelElement(submodelBase: any): ISubmodelElement {
  const schema = z.object({ modelType: KeyTypesEnum });
  const AasClass = getSubmodelClass(schema.parse(submodelBase).modelType);
  return AasClass.fromPlain(submodelBase);
}

export function deleteSubmodelElementOrFail(submodelElements: ISubmodelElement[], idShort: string): void {
  const foundIndex = submodelElements.findIndex(e => e.idShort === idShort);
  if (foundIndex === -1) {
    throw new ValueError(`Cannot delete submodel element with idShort ${idShort}, since it does not exist.`);
  }
  submodelElements.splice(foundIndex, 1);
}

export function cloneSubmodelElement(submodelElement: ISubmodelElement, override?: any): ISubmodelElement {
  const clone = override ? { ...submodelElement.toPlain(), ...override } : submodelElement.toPlain();
  return parseSubmodelElement(clone);
}
