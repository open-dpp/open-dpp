import { IChangeEvent } from "../change-event";
import { z } from "zod/v4";
import { ChangeEventTypes } from "../change-event-types";
import { ConvertToPlainOptions } from "../../../../aas/domain/convertable-to-plain";
import {
  PassportEditingModeEnum,
  PassportEditingModeType,
} from "../../../../digital-product-document/domain/editing-mode";

const PassportEditingModeChangedSchema = z.object({
  type: z.literal(ChangeEventTypes.PassportEditingModeChanged),
  oldValue: PassportEditingModeEnum,
  newValue: PassportEditingModeEnum,
});

/**
 * Legacy: recorded when a passport's data-only restriction was removed. Nothing creates it any
 * more (the editing mode is derived from the template's publication), but it stays registered so
 * stored activity history still deserializes.
 */
export class PassportEditingModeChanged implements IChangeEvent {
  public readonly type = ChangeEventTypes.PassportEditingModeChanged;

  private constructor(
    public readonly oldValue: PassportEditingModeType,
    public readonly newValue: PassportEditingModeType,
  ) {}

  isNoop(): boolean {
    return this.oldValue === this.newValue;
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
