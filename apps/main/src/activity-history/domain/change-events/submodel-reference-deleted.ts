import { IChangeEvent } from "./change-event";
import { ChangeEventTypes } from "./change-event-types";
import { z } from "zod";
import { Reference } from "../../../aas/domain/common/reference";
import { ReferenceJsonSchema } from "@open-dpp/dto";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";

const SubmodelReferenceDeletedSchema = z.object({
  type: z.literal(ChangeEventTypes.SubmodelReferenceDeleted),
  value: ReferenceJsonSchema,
});

export class SubmodelReferenceDeleted implements IChangeEvent {
  public readonly type = ChangeEventTypes.SubmodelReferenceDeleted;
  private constructor(public readonly value: Reference) {}

  static create(data: { submodelRef: Reference }) {
    return new SubmodelReferenceDeleted(data.submodelRef);
  }
  static fromPlain(data: unknown): IChangeEvent {
    const parsed = SubmodelReferenceDeletedSchema.parse(data);
    return new SubmodelReferenceDeleted(Reference.fromPlain(parsed.value));
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      value: this.value.toPlain(),
    };
  }
}
