import { IChangeEvent } from "./change-event";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { SubmodelJsonSchema } from "@open-dpp/dto";

const SubmodelDeletedSchema = z.object({
  type: z.literal(ChangeEventTypes.SubmodelDeleted),
  value: SubmodelJsonSchema,
});

export class SubmodelDeleted implements IChangeEvent {
  public readonly type = ChangeEventTypes.SubmodelDeleted;

  private constructor(public readonly value: Submodel) {}

  static create(data: { submodel: Submodel }) {
    return new SubmodelDeleted(data.submodel);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = SubmodelDeletedSchema.parse(data);
    return new SubmodelDeleted(Submodel.fromPlain(parsed.value));
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      value: this.value.toPlain(),
    };
  }
}
