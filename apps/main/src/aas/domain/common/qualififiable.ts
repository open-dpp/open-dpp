import { DataTypeDef } from "./data-type-def";
import { IHasSemantics } from "./has-semantics";
import { Reference } from "./reference";

export enum QualifierKind {
  ValueQualifier = "ValueQualifier",
  ConceptQualifier = "ConceptQualifier",
  TemplateQualifier = "TemplateQualifier",
}

export class Qualifier implements IHasSemantics {
  private constructor(public readonly type: string, public valueType: DataTypeDef, public readonly supplementalSemanticIds: Reference[], public readonly kind: QualifierKind, public value: string | null, public valueId: Reference | null) {
  }

  static create(data: { type: string; valueType: DataTypeDef; semanticId?: Reference; supplementalSemanticIds: Reference[]; kind: QualifierKind; value?: string; valueId?: Reference }): Qualifier {
    return new Qualifier(data.type, data.valueType, data.semanticId ?? null, data.supplementalSemanticIds, data.kind, data.value ?? null, data.valueId ?? null);
  }
}

export interface IQualifiable {
  qualifiers: Qualifier[] | null;
}
