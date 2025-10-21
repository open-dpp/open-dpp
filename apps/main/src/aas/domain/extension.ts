import { DataTypeDef } from "./common/data-type-def";
import { Reference } from "./common/reference";

export class Extension {
  private constructor(
    public readonly name: string,
    public readonly semanticId: Reference | null = null,
    public readonly supplementalSemanticIds: Array<Reference> | null = null,
    public readonly valueType: DataTypeDef | null = null,
    public readonly value: string | null = null,
    public readonly refersTo: Array<Reference> | null = null,
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
      data.supplementalSemanticIds ?? null,
      data.valueType ?? null,
      data.value ?? null,
      data.refersTo ?? null,
    );
  }
}
