import { NotSupportedError } from "@open-dpp/exception";
import { z } from "zod";
import { KeyTypes } from "../common/key-types-enum";
import { LanguageText } from "../common/language-text";
import { Qualifier } from "../common/qualififiable";
import { Reference } from "../common/reference";
import { EmbeddedDataSpecification } from "../embedded-data-specification";
import { SubmodelBaseJsonSchema } from "../parsing/submodel-base/submodel-base-json-schema";
import { IVisitor } from "../visitor";
import { ISubmodelBase } from "./submodel";
import { getSubmodelClass } from "./submodel-registry";

export abstract class SubmodelBase implements ISubmodelBase {
  protected constructor(
    public readonly category: string | null,
    public readonly idShort: string | null,
    public readonly displayName: Array<LanguageText>,
    public readonly description: Array<LanguageText>,
    public readonly semanticId: Reference | null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly qualifiers: Qualifier[],
    public readonly embeddedDataSpecifications: Array<EmbeddedDataSpecification>,
  ) {
  }

  static fromPlain(data: Record<string, unknown>): SubmodelBase {
    throw new NotSupportedError("Method not implemented.");
  }

  abstract accept(visitor: IVisitor<any>): any;
}

export interface SubmodelBaseProps {
  category?: string;
  idShort?: string;
  displayName?: Array<LanguageText>;
  description?: Array<LanguageText>;
  semanticId?: Reference;
  supplementalSemanticIds?: Array<Reference>;
  qualifiers?: Array<Qualifier>;
  embeddedDataSpecifications?: Array<EmbeddedDataSpecification>;
}

export function submodelBasePropsFromPlain(data: Record<string, unknown>): SubmodelBaseProps {
  const parsed = SubmodelBaseJsonSchema.parse(data);
  return {
    category: parsed.category,
    idShort: parsed.idShort,
    displayName: parsed.displayName.map(x => LanguageText.fromPlain(x)),
    description: parsed.description.map(x => LanguageText.fromPlain(x)),
    semanticId: parsed.semanticId ? Reference.fromPlain(parsed.semanticId) : undefined,
    supplementalSemanticIds: parsed.supplementalSemanticIds.map(x => Reference.fromPlain(x)),
    qualifiers: parsed.qualifiers.map(q => Qualifier.fromPlain(q)),
    embeddedDataSpecifications: parsed.embeddedDataSpecifications.map(e => EmbeddedDataSpecification.fromPlain(e)),
  };
}

export function parseSubmodelBaseUnion(submodelBase: any): ISubmodelBase {
  const schema = z.object({ modelType: z.enum(KeyTypes) });
  const AasClass = getSubmodelClass(schema.parse(submodelBase).modelType);
  return AasClass.fromPlain(submodelBase);
}
