import { IChangeEvent } from "./change-event";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { PassportEditingModeEnum, PassportEditingModeType } from "../../../digital-product-document/domain/passport-editing-mode";

const PassportEditingModeChangedSchema = z.object({
  type: z.literal(ChangeEventTypes.PassportEditingModeChanged),
  oldValue: PassportEditingModeEnum,
  newValue: PassportEditingModeEnum,
});

export class PassportEditingModeChanged implements IChangeEvent {
  public readonly type = ChangeEventTypes.PassportEditingModeChanged;

  private constructor(
    public readonly oldValue: PassportEditingModeType,
    public readonly newValue: PassportEditingModeType,
  ) {}

  isNoop(): boolean {
    return this.oldValue === this.newValue;
  }

  static create(data: { oldValue: PassportEditingModeType; newValue: PassportEditingModeType }) {
    return new PassportEditingModeChanged(data.oldValue, data.newValue);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = PassportEditingModeChangedSchema.parse(data);
    return new PassportEditingModeChanged(parsed.oldValue, parsed.newValue);
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      oldValue: this.oldValue,
      newValue: this.newValue,
    };
  }
}
