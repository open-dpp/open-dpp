import { DataTypeDefType, QualifierJsonSchema, QualifierKindType } from "@open-dpp/dto";
import { IVisitable, IVisitor } from "../visitor";
import { IHasSemantics } from "./has-semantics";
import { Reference } from "./reference";

export class Qualifier implements IHasSemantics, IVisitable {
  private constructor(
    public readonly type: string,
    public valueType: DataTypeDefType,
    public semanticId: Reference | null,
    public readonly supplementalSemanticIds: Reference[],
    public readonly kind: QualifierKindType,
    public value: string | null,
    public valueId: Reference | null,
  ) {
  }

  static create(data: {
    type: string;
    valueType: DataTypeDefType;
    semanticId?: Reference | null;
    supplementalSemanticIds: Reference[];
    kind: QualifierKindType;
    value?: string | null;
    valueId?: Reference | null;
  }): Qualifier {
    return new Qualifier(
      data.type,
      data.valueType,
      data.semanticId ?? null,
      data.supplementalSemanticIds,
      data.kind,
      data.value ?? null,
      data.valueId ?? null,
    );
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

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitQualifier(this, context);
  }
}

export interface IQualifiable {
  qualifiers: Qualifier[];
}
