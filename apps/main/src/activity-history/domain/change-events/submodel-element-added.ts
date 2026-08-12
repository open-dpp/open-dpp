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

const SubmodelElementAddedSchema = z.object({
  type: z.literal(ChangeEventTypes.SubmodelElementAdded),
  path: z.string(),
  value: SubmodelElementSchema,
});

export class SubmodelElementAdded implements IChangeEventWithPath {
  public readonly type = ChangeEventTypes.SubmodelElementAdded;
  private constructor(
    public readonly path: IdShortPath,
    public readonly value: ISubmodelElement,
  ) {
    if (!value.getIdShortPath().isEqual(this.path)) {
      value.setParentPointer(Pointer.create({ parentIdShortPath: this.path.getParentPath() }));
    }
  }

  isNoop(): boolean {
    return false;
  }

  static create(data: { path: IdShortPath; submodelElement: ISubmodelElement }) {
    return new SubmodelElementAdded(data.path, data.submodelElement);
  }
  static fromPlain(data: unknown): IChangeEvent {
    const parsed = SubmodelElementAddedSchema.parse(data);
    return new SubmodelElementAdded(
      IdShortPath.create({ path: parsed.path }),
      parseSubmodelElement(parsed.value),
    );
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      path: this.path.toString(),
      value: this.value.toPlain(options),
    };
  }
}
