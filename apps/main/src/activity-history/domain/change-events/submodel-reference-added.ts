import { IChangeEvent } from "./change-event";
import { ChangeEventTypes } from "./change-event-types";
import { z } from "zod";
import { Reference } from "../../../aas/domain/common/reference";
import { ReferenceJsonSchema } from "@open-dpp/dto";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";

const SubmodelReferenceAddedSchema = z.object({
  type: z.literal(ChangeEventTypes.SubmodelReferenceAdded),
  value: ReferenceJsonSchema,
});

export class SubmodelReferenceAdded implements IChangeEvent {
  public readonly type = ChangeEventTypes.SubmodelReferenceAdded;
  private constructor(public readonly value: Reference) {}

  isNoop(): boolean {
    return false;
  }

  static create(data: { submodelRef: Reference }) {
    return new SubmodelReferenceAdded(data.submodelRef);
  }
  static fromPlain(data: unknown): IChangeEvent {
    const parsed = SubmodelReferenceAddedSchema.parse(data);
    return new SubmodelReferenceAdded(Reference.fromPlain(parsed.value));
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      value: this.value.toPlain(),
    };
  }
}
