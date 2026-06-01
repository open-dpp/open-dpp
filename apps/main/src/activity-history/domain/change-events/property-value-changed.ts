import { DataTypeDefEnum, DataTypeDefType } from "@open-dpp/dto";
import { IChangeEvent, IChangeEventWithPath } from "./change-event";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";

const ValueChangedSchema = z.object({
  valueType: DataTypeDefEnum,
  path: z.string(),
  oldValue: z.string().nullable(),
  newValue: z.string().nullable(),
});
export class PropertyValueChanged implements IChangeEventWithPath {
  public readonly type = ChangeEventTypes.PropertyValueChanged;
  private constructor(
    public readonly valueType: DataTypeDefType,
    public readonly path: IdShortPath,
    public readonly oldValue: string | null,
    public readonly newValue: string | null,
  ) {}

  static create(data: {
    path: IdShortPath;
    valueType: DataTypeDefType;
    oldValue: string | null;
    newValue: string | null;
  }) {
    return new PropertyValueChanged(data.valueType, data.path, data.oldValue, data.newValue);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = ValueChangedSchema.parse(data);
    return new PropertyValueChanged(
      parsed.valueType,
      IdShortPath.create({ path: parsed.path }),
      parsed.oldValue,
      parsed.newValue,
    );
  }
  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      valueType: this.valueType,
      path: this.path.toString(),
      oldValue: this.oldValue,
      newValue: this.newValue,
    };
  }
}
