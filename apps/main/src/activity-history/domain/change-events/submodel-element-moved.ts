import { IChangeEvent, IChangeEventWithPath } from "./change-event";
import {
  ISubmodelElement,
  parseSubmodelElement,
} from "../../../aas/domain/submodel-base/submodel-base";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { ChangeEventTypes } from "./change-event-types";
import { z } from "zod";
import { SubmodelElementSchema } from "@open-dpp/dto";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { Pointer } from "../../../aas/domain/submodel-base/pointer";

const SubmodelElementMovedSchema = z.object({
  type: z.literal(ChangeEventTypes.SubmodelElementMoved),
  oldPath: z.string(),
  path: z.string(),
  position: z.number(),
  value: SubmodelElementSchema,
});

export class SubmodelElementMoved implements IChangeEventWithPath {
  public readonly type = ChangeEventTypes.SubmodelElementMoved;

  private constructor(
    public readonly oldPath: IdShortPath,
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

  static create(data: {
    oldPath: IdShortPath;
    newPath: IdShortPath;
    position: number;
    value: ISubmodelElement;
  }) {
    return new SubmodelElementMoved(data.oldPath, data.newPath, data.position, data.value);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = SubmodelElementMovedSchema.parse(data);
    return new SubmodelElementMoved(
      IdShortPath.create({ path: parsed.oldPath }),
      IdShortPath.create({ path: parsed.path }),
      parsed.position,
      parseSubmodelElement(parsed.value),
    );
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      oldPath: this.oldPath.toString(),
      path: this.path.toString(),
      position: this.position,
      value: this.value.toPlain(options),
    };
  }
}
