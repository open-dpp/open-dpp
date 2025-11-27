import { IVisitable, IVisitor } from "../visitor";
import { QualifierJsonSchema } from "../zod-schemas";
import { DataTypeDef } from "./data-type-def";
import { IHasSemantics } from "./has-semantics";
import { Reference } from "./reference";

export enum QualifierKind {
  ValueQualifier = "ValueQualifier",
  ConceptQualifier = "ConceptQualifier",
  TemplateQualifier = "TemplateQualifier",
}

export class Qualifier implements IHasSemantics, IVisitable<any> {
  private constructor(public readonly type: string, public valueType: DataTypeDef, public semanticId: Reference | null, public readonly supplementalSemanticIds: Reference[], public readonly kind: QualifierKind, public value: string | null, public valueId: Reference | null) {
  }

  static create(data: { type: string; valueType: DataTypeDef; semanticId?: Reference; supplementalSemanticIds: Reference[]; kind: QualifierKind; value?: string; valueId?: Reference }): Qualifier {
    return new Qualifier(data.type, data.valueType, data.semanticId ?? null, data.supplementalSemanticIds, data.kind, data.value ?? null, data.valueId ?? null);
  }

  static fromPlain(json: Record<string, unknown>): Qualifier {
    const parsed = QualifierJsonSchema.parse(json);
    return Qualifier.create({
      type: parsed.type,
      valueType: parsed.valueType,
      semanticId: parsed.semanticId ? Reference.fromPlain(parsed.semanticId) : undefined,
      supplementalSemanticIds: parsed.supplementalSemanticIds.map(s => Reference.fromPlain(s)),
      kind: parsed.kind,
      value: parsed.value,
      valueId: parsed.valueId ? Reference.fromPlain(parsed.valueId) : undefined,
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitQualifier(this);
  }
}

export interface IQualifiable {
  qualifiers: Qualifier[] | null;
}
