import { IChangeEvent, IChangeEventWithPath } from "./change-event";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { SubmodelElementSchema } from "@open-dpp/dto";
import {
  ISubmodelElement,
  parseSubmodelElement,
} from "../../../aas/domain/submodel-base/submodel-base";

const ColumnDeletedSchema = z.object({
  type: z.literal(ChangeEventTypes.ColumnDeleted),
  path: z.string(),
  position: z.number(),
  value: SubmodelElementSchema,
});

export class ColumnDeleted implements IChangeEventWithPath {
  public readonly type = ChangeEventTypes.ColumnDeleted;

  private constructor(
    public readonly path: IdShortPath,
    public readonly position: number,
    public readonly value: ISubmodelElement,
  ) {}

  isNoop(): boolean {
    return false;
  }

  static create(data: { path: IdShortPath; position: number; value: ISubmodelElement }) {
    return new ColumnDeleted(data.path, data.position, data.value);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = ColumnDeletedSchema.parse(data);
    return new ColumnDeleted(
      IdShortPath.create({ path: parsed.path }),
      parsed.position,
      parseSubmodelElement(parsed.value),
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
