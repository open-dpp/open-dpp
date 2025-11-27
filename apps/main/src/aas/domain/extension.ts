import { DataTypeDef } from "./common/data-type-def";
import { Reference } from "./common/reference";
import { IVisitable, IVisitor } from "./visitor";
import { ExtensionJsonSchema } from "./zod-schemas";

export class Extension implements IVisitable<any> {
  private constructor(
    public readonly name: string,
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly valueType: DataTypeDef | null = null,
    public readonly value: string | null = null,
    public readonly refersTo: Array<Reference>,
  ) {

  }

  static create(
    data: {
      name: string;
      semanticId?: Reference;
      supplementalSemanticIds?: Array<Reference>;
      valueType?: DataTypeDef;
      value?: string;
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

  static fromPlain(data: Record<string, unknown>): Extension {
    const parsed = ExtensionJsonSchema.parse(data);
    return Extension.create({
      name: parsed.name,
      semanticId: parsed.semanticId ? Reference.fromPlain(parsed.semanticId) : undefined,
      supplementalSemanticIds: parsed.supplementalSemanticIds.map(s => Reference.fromPlain(s)),
      valueType: parsed.valueType,
      value: parsed.value,
      refersTo: parsed.refersTo.map(s => Reference.fromPlain(s)),
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitExtension(this);
  }
}
