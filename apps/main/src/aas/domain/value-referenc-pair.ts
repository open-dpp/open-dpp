import { Reference } from "./common/reference";

export class ValueReferencePair {
  private constructor(public readonly value: string, public readonly valueId: Reference) {
  }

  static create(data: { value: string; valueId: Reference }): ValueReferencePair {
    return new ValueReferencePair(data.value, data.valueId);
  }
}
