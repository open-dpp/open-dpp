import { DataTypeDefType, ExtensionJsonSchema } from "@open-dpp/dto";
import { Reference } from "./common/reference";
import { IVisitable, IVisitor } from "./visitor";

export class Extension implements IVisitable {
  private constructor(
    public readonly name: string,
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly valueType: DataTypeDefType | null = null,
    public readonly value: string | null = null,
    public readonly refersTo: Array<Reference>,
  ) {

  }

  static create(
    data: {
      name: string;
      semanticId?: Reference | null;
      supplementalSemanticIds?: Array<Reference>;
      valueType?: DataTypeDefType | null;
      value?: string | null;
      refersTo?: Array<Reference>;
    },
  ) {
    return new Extension(
      data.name,
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.valueType ?? null,
      data.value ?? null,
      data.refersTo ?? [],
    );
  }

  static fromPlain(data: unknown): Extension {
    const parsed = ExtensionJsonSchema.parse(data);
    return new Extension(
      parsed.name,
      parsed.semanticId ? Reference.fromPlain(parsed.semanticId) : undefined,
      parsed.supplementalSemanticIds.map(s => Reference.fromPlain(s)),
      parsed.valueType,
      parsed.value,
      parsed.refersTo.map(s => Reference.fromPlain(s)),
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitExtension(this, context);
  }
}
