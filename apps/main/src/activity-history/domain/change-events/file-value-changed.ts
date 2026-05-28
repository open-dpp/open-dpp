import { IChangeEvent } from "./change-event";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";

const FileValueSchema = z.object({
  contentType: z.string().nullable(),
  value: z.string().nullable(),
});
const ValueChangedSchema = z.object({
  path: z.string(),
  oldValue: FileValueSchema,
  newValue: FileValueSchema,
});
type FileValue = z.infer<typeof FileValueSchema>;
export class FileValueChanged implements IChangeEvent {
  public readonly type = ChangeEventTypes.FileValueChanged;
  private constructor(
    public readonly path: IdShortPath,
    public readonly oldValue: FileValue,
    public readonly newValue: FileValue,
  ) {}

  static create(data: { path: IdShortPath; oldValue: FileValue; newValue: FileValue }) {
    return new FileValueChanged(data.path, data.oldValue, data.newValue);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = ValueChangedSchema.parse(data);
    return new FileValueChanged(
      IdShortPath.create({ path: parsed.path }),
      parsed.oldValue,
      parsed.newValue,
    );
  }
  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      path: this.path.toString(),
      oldValue: this.oldValue,
      newValue: this.newValue,
    };
  }
}
