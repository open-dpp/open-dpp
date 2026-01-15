import { ValueReferencePair } from "./value-referenc-pair";

export class ValueList {
  private constructor(
    public readonly valueReferencePairs: Array<ValueReferencePair>,
  ) {
  }

  static create(data: {
    valueReferencePairs: Array<ValueReferencePair>;
  }) {
    return new ValueList(
      data.valueReferencePairs,
    );
  }
}
