import { IChangeEvent } from "./change-event";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";

const PassportLockEnabledSchema = z.object({
  type: z.literal(ChangeEventTypes.PassportLockEnabled),
  oldValue: z.boolean(),
  newValue: z.boolean(),
});

export class PassportLockEnabled implements IChangeEvent {
  public readonly type = ChangeEventTypes.PassportLockEnabled;

  private constructor(
    public readonly oldValue: boolean,
    public readonly newValue: boolean,
  ) {}

  isNoop(): boolean {
    return this.oldValue === this.newValue;
  }

  static create(data: { oldValue: boolean; newValue: boolean }) {
    return new PassportLockEnabled(data.oldValue, data.newValue);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = PassportLockEnabledSchema.parse(data);
    return new PassportLockEnabled(parsed.oldValue, parsed.newValue);
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      oldValue: this.oldValue,
      newValue: this.newValue,
    };
  }
}
