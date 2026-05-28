import { IChangeEvent } from "./change-event";
import {
  ISubmodelElement,
  parseSubmodelElement,
} from "../../../aas/domain/submodel-base/submodel-base";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { SubmodelElementSchema } from "@open-dpp/dto";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";

const SubmodelElementDeletedSchema = z.object({
  type: z.literal(ChangeEventTypes.SubmodelElementDeleted),
  path: z.string(),
  value: SubmodelElementSchema,
});

export class SubmodelElementDeleted implements IChangeEvent {
  public readonly type = ChangeEventTypes.SubmodelElementDeleted;
  private constructor(
    public readonly path: IdShortPath,
    public readonly value: ISubmodelElement,
  ) {}

  static create(data: { path: IdShortPath; submodelElement: ISubmodelElement }) {
    return new SubmodelElementDeleted(data.path, data.submodelElement);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = SubmodelElementDeletedSchema.parse(data);
    return new SubmodelElementDeleted(
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
