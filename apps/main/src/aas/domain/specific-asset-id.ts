import { IHasSemantics } from "./common/has-semantics";
import { Reference } from "./common/reference";

export class SpecificAssetId implements IHasSemantics {
  private constructor(
    public readonly name: string,
    public readonly value: string,
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Array<Reference> | null = null,
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
      data.supplementalSemanticIds ?? null,
      data.externalSubjectId ?? null,
    );
  }
}
