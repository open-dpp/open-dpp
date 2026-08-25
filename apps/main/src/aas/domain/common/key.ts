import { KeyJsonSchema, KeyTypesType } from "@open-dpp/dto";
import { IVisitable, IVisitor } from "../visitor";

export class Key implements IVisitable {
  private constructor(
    public type: KeyTypesType,
    public value: string,
  ) {}

  static create(data: { type: KeyTypesType; value: string }) {
    return new Key(data.type, data.value);
  }

  static fromPlain(json: unknown) {
    return Key.create(KeyJsonSchema.parse(json));
  }

  toPlain(): Record<string, any> {
    return {
      type: this.type,
      value: this.value,
    };
  }

  equals(other: Key): boolean {
    return this.type === other.type && this.value === other.value;
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitKey(this, context);
  }
}
