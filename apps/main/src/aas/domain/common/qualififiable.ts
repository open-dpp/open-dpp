import { QualifierJsonSchema } from "../parsing/common/qualifier-json-schema";
import { IVisitable, IVisitor } from "../visitor";
import { DataTypeDefType } from "./data-type-def";
import { IHasSemantics } from "./has-semantics";
import { QualifierKindType } from "./qualifier-kind-enum";
import { Reference } from "./reference";

export class Qualifier implements IHasSemantics, IVisitable<any> {
  private constructor(public readonly type: string, public valueType: DataTypeDefType, public semanticId: Reference | null, public readonly supplementalSemanticIds: Reference[], public readonly kind: QualifierKindType, public value: string | null, public valueId: Reference | null) {
  }

  static create(data: { type: string; valueType: DataTypeDefType; semanticId?: Reference; supplementalSemanticIds: Reference[]; kind: QualifierKindType; value?: string; valueId?: Reference }): Qualifier {
    return new Qualifier(data.type, data.valueType, data.semanticId ?? null, data.supplementalSemanticIds, data.kind, data.value ?? null, data.valueId ?? null);
  }

  static fromPlain(json: unknown): Qualifier {
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
