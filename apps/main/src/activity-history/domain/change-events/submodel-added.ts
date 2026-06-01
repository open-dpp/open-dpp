import { IChangeEvent } from "./change-event";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { SubmodelJsonSchema } from "@open-dpp/dto";

const SubmodelAddedSchema = z.object({
  type: z.literal(ChangeEventTypes.SubmodelAdded),
  value: SubmodelJsonSchema,
});

export class SubmodelAdded implements IChangeEvent {
  public readonly type = ChangeEventTypes.SubmodelAdded;

  private constructor(public readonly value: Submodel) {}

  static create(data: { submodel: Submodel }) {
    return new SubmodelAdded(data.submodel);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = SubmodelAddedSchema.parse(data);
    return new SubmodelAdded(Submodel.fromPlain(parsed.value));
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      value: this.value.toPlain(),
    };
  }
}
