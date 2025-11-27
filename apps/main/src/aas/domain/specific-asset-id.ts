import { IHasSemantics } from "./common/has-semantics";
import { Reference } from "./common/reference";
import { SpecificAssetIdJsonSchema } from "./parsing/aas-json-schemas";
import { IVisitable, IVisitor } from "./visitor";

export class SpecificAssetId implements IHasSemantics, IVisitable<any> {
  private constructor(
    public readonly name: string,
    public readonly value: string,
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Array<Reference>,
    public readonly externalSubjectId: Reference | null = null,
  ) {
  }

  static create(data: {
    name: string;
    value: string;
    semanticId?: Reference;
    supplementalSemanticIds?: Array<Reference>;
    externalSubjectId?: Reference;
  }) {
    return new SpecificAssetId(
      data.name,
      data.value,
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.externalSubjectId ?? null,
    );
  }

  static fromPlain(data: Record<string, unknown>): SpecificAssetId {
    const parsed = SpecificAssetIdJsonSchema.parse(data);
    return SpecificAssetId.create({
      name: parsed.name,
      value: parsed.value,
      semanticId: parsed.semanticId ? Reference.fromPlain(parsed.semanticId) : undefined,
      supplementalSemanticIds: parsed.supplementalSemanticIds.map(s => Reference.fromPlain(s)),
      externalSubjectId: parsed.externalSubjectId ? Reference.fromPlain(parsed.externalSubjectId) : undefined,
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitSpecificAssetId(this);
  }
}
