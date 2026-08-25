import { IChangeEvent, IChangeEventWithPath } from "./change-event";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { SubmodelElementCollectionJsonSchema } from "@open-dpp/dto";
import { SubmodelElementCollection } from "../../../aas/domain/submodel-base/submodel-element-collection";
import { ISubmodelElement } from "../../../aas/domain/submodel-base/submodel-base";
import { Pointer } from "../../../aas/domain/submodel-base/pointer";

const RowAddedSchema = z.object({
  type: z.literal(ChangeEventTypes.RowAdded),
  path: z.string(),
  position: z.number(),
  value: SubmodelElementCollectionJsonSchema,
});

export class RowAdded implements IChangeEventWithPath {
  public readonly type = ChangeEventTypes.RowAdded;

  private constructor(
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

  static create(data: { path: IdShortPath; position: number; value: ISubmodelElement }) {
    return new RowAdded(data.path, data.position, data.value);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = RowAddedSchema.parse(data);
    return new RowAdded(
      IdShortPath.create({ path: parsed.path }),
      parsed.position,
      SubmodelElementCollection.fromPlain(parsed.value),
    );
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      path: this.path.toString(),
      position: this.position,
      value: this.value.toPlain(options),
    };
  }
}
