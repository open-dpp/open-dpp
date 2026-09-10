import { IChangeEvent, IChangeEventWithPath } from "./change-event";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";

const SubmodelMovedSchema = z.object({
  type: z.literal(ChangeEventTypes.SubmodelMoved),
  submodelId: z.string(),
  oldPosition: z.number(),
  position: z.number(),
  path: z.string(),
});

export class SubmodelMoved implements IChangeEventWithPath {
  public readonly type = ChangeEventTypes.SubmodelMoved;

  private constructor(
    public readonly submodelId: string,
    public readonly oldPosition: number,
    public readonly position: number,
    public readonly path: IdShortPath,
  ) {}

  isNoop(): boolean {
    return this.oldPosition === this.position;
  }

  static create(data: {
    submodelId: string;
    oldPosition: number;
    position: number;
    path: IdShortPath;
  }) {
    return new SubmodelMoved(data.submodelId, data.oldPosition, data.position, data.path);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = SubmodelMovedSchema.parse(data);
    return new SubmodelMoved(
      parsed.submodelId,
      parsed.oldPosition,
      parsed.position,
      IdShortPath.create({ path: parsed.path }),
    );
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      submodelId: this.submodelId,
      oldPosition: this.oldPosition,
      position: this.position,
      path: this.path.toString(),
    };
  }
}
