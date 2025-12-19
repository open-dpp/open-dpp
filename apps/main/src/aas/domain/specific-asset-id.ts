import { SpecificAssetIdJsonSchema } from "@open-dpp/dto";
import { IHasSemantics } from "./common/has-semantics";
import { Reference } from "./common/reference";
import { IVisitable, IVisitor } from "./visitor";

export class SpecificAssetId implements IHasSemantics, IVisitable {
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
    semanticId?: Reference | null;
    supplementalSemanticIds?: Array<Reference>;
    externalSubjectId?: Reference | null;
  }) {
    return new SpecificAssetId(
      data.name,
      data.value,
      data.semanticId ?? null,
      data.supplementalSemanticIds ?? [],
      data.externalSubjectId ?? null,
    );
  }

  static fromPlain(data: unknown): SpecificAssetId {
    const parsed = SpecificAssetIdJsonSchema.parse(data);
    return new SpecificAssetId(
      parsed.name,
      parsed.value,
      parsed.semanticId ? Reference.fromPlain(parsed.semanticId) : null,
      parsed.supplementalSemanticIds.map(s => Reference.fromPlain(s)),
      parsed.externalSubjectId ? Reference.fromPlain(parsed.externalSubjectId) : null,
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitSpecificAssetId(this, context);
  }
}
