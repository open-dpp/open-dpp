import { IChangeEvent, IChangeEventWithPath } from "./change-event";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import {
  ISubmodelElement,
  parseSubmodelElement,
} from "../../../aas/domain/submodel-base/submodel-base";
import { Pointer } from "../../../aas/domain/submodel-base/pointer";
import { ColumnGroupEventCreateProps, ColumnGroupSchema } from "./column-group-shared";

const ColumnDeletedFromGroupSchema = z.object({
  ...ColumnGroupSchema.shape,
  type: z.literal(ChangeEventTypes.ColumnDeletedFromGroup),
});

export class ColumnDeletedFromGroup implements IChangeEventWithPath {
  public readonly type = ChangeEventTypes.ColumnDeletedFromGroup;

  private constructor(
    public readonly groupIdShort: string,
    public readonly path: IdShortPath,
    public readonly position: number,
    public readonly value: ISubmodelElement,
  ) {
    if (!value.getIdShortPath().isEqual(this.path)) {
      value.setParentPointer(Pointer.create({ parentIdShortPath: this.path.getParentPath() }));
    }
  }

  isNoop(): boolean {
    return false;
  }

  static create(data: ColumnGroupEventCreateProps) {
    return new ColumnDeletedFromGroup(data.groupIdShort, data.path, data.position, data.value);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = ColumnDeletedFromGroupSchema.parse(data);
    return new ColumnDeletedFromGroup(
      parsed.groupIdShort,
      IdShortPath.create({ path: parsed.path }),
      parsed.position,
      parseSubmodelElement(parsed.value),
    );
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      groupIdShort: this.groupIdShort,
      path: this.path.toString(),
      position: this.position,
      value: this.value.toPlain(options),
    };
  }
}
