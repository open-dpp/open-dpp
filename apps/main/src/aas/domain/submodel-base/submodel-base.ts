import { AasSubmodelElementsType, KeyTypes, SubmodelBaseJsonSchema } from "@open-dpp/aas";
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

export interface SubmodelBaseObjects {
  category: string | null;
  idShort: string;
  displayName: Array<LanguageText>;
  description: Array<LanguageText>;
  semanticId: Reference | null;
  supplementalSemanticIds: Array<Reference>;
  qualifiers: Array<Qualifier>;
  embeddedDataSpecifications: Array<EmbeddedDataSpecification>;
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

  get segments(): IterableIterator<string> {
    return this._segments[Symbol.iterator]();
  }

  toString(): string {
    return this._segments.join(".");
  }
}

export interface ISubmodelBase
  extends IReferable,
  IHasSemantics,
  IQualifiable,
  IVisitable,
  IHasDataSpecification, IConvertableToPlain {
  category: string | null;
  idShort: string;
  displayName: Array<LanguageText>;
  description: Array<LanguageText>;
  semanticId: Reference | null;
  supplementalSemanticIds: Array<Reference>;
  qualifiers: Qualifier[];
  embeddedDataSpecifications: Array<EmbeddedDataSpecification>;
  addSubmodelElement: (submodelElement: ISubmodelElement) => ISubmodelElement;
  getSubmodelElements: () => IterableIterator<ISubmodelElement>;
}

export interface ISubmodelElement extends ISubmodelBase {
  getSubmodelElementType: () => AasSubmodelElementsType;
}

export function parseSubmodelBaseUnion(submodelBase: any): ISubmodelElement {
  const schema = z.object({ modelType: z.enum(KeyTypes) });
  const AasClass = getSubmodelClass(schema.parse(submodelBase).modelType);
  return AasClass.fromPlain(submodelBase);
}
