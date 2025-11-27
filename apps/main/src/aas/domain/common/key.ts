import { KeyJsonSchema } from "../parsing/key-json-schema";
import { IVisitable, IVisitor } from "../visitor";
import { KeyTypesType } from "./key-types-enum";

export class Key implements IVisitable<any> {
  private constructor(public type: KeyTypesType, public value: string) {
  }

  static create(data: {
    type: KeyTypesType;
    value: string;
  }) {
    return new Key(data.type, data.value);
  }

  static fromPlain(json: Record<string, unknown>) {
    return Key.create(KeyJsonSchema.parse(json));
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitKey(this);
  }
}
