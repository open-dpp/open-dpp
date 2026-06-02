import { IChangeEvent, IChangeEventWithPath } from "./change-event";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { ReferenceJsonSchema } from "@open-dpp/dto";
import { Reference } from "../../../aas/domain/common/reference";

const ValueSchema = ReferenceJsonSchema.nullable();
const ValueChangedSchema = z.object({
  path: z.string(),
  oldValue: ValueSchema,
  newValue: ValueSchema,
});
type Value = Reference | null;
export class ReferenceElementValueChanged implements IChangeEventWithPath {
  public readonly type = ChangeEventTypes.ReferenceElementValueChanged;
  private constructor(
    public readonly path: IdShortPath,
    public readonly oldValue: Value,
    public readonly newValue: Value,
  ) {}

  static create(data: { path: IdShortPath; oldValue: Value; newValue: Value }) {
    return new ReferenceElementValueChanged(data.path, data.oldValue, data.newValue);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = ValueChangedSchema.parse(data);
    return new ReferenceElementValueChanged(
      IdShortPath.create({ path: parsed.path }),
      parsed.oldValue,
      parsed.newValue,
    );
  }
  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      path: this.path.toString(),
      oldValue: this.oldValue ? this.oldValue.toPlain() : null,
      newValue: this.newValue ? this.newValue.toPlain() : null,
    };
  }
}
