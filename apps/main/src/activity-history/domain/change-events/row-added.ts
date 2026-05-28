import { IChangeEvent } from "./change-event";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";

const RowAddedSchema = z.object({
  type: z.literal(ChangeEventTypes.RowAdded),
  path: z.string(),
  position: z.number(),
});

export class RowAdded implements IChangeEvent {
  public readonly type = ChangeEventTypes.RowAdded;

  private constructor(
    public readonly path: IdShortPath,
    public readonly position: number,
  ) {}

  static create(data: { path: IdShortPath; position: number; newValue: string | null }) {
    return new RowAdded(data.path, data.position);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = RowAddedSchema.parse(data);
    return new RowAdded(IdShortPath.create({ path: parsed.path }), parsed.position);
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      path: this.path.toString(),
      position: this.position,
    };
  }
}
