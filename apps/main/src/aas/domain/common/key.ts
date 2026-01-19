import { KeyJsonSchema, KeyTypesType } from "@open-dpp/dto";
import { IVisitable, IVisitor } from "../visitor";

export class Key implements IVisitable {
  private constructor(public type: KeyTypesType, public value: string) {
  }

  static create(data: {
    type: KeyTypesType;
    value: string;
  }) {
    return new Key(data.type, data.value);
  }

  static fromPlain(json: unknown) {
    return Key.create(KeyJsonSchema.parse(json));
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitKey(this, context);
  }
}
