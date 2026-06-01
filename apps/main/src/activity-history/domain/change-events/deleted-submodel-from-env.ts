import { IChangeEvent } from "./change-event";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";

const DeletedSubmodelFromEnvSchema = z.object({
  type: z.literal(ChangeEventTypes.DeletedSubmodelFromEnv),
  position: z.number(),
  submodelId: z.string(),
});

export class DeletedSubmodelFromEnv implements IChangeEvent {
  public readonly type = ChangeEventTypes.DeletedSubmodelFromEnv;

  private constructor(
    public readonly submodelId: string,
    public readonly position: number,
  ) {}

  static create(data: { position: number; submodel: Submodel }) {
    return new DeletedSubmodelFromEnv(data.submodel.id, data.position);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = DeletedSubmodelFromEnvSchema.parse(data);
    return new DeletedSubmodelFromEnv(parsed.submodelId, parsed.position);
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      submodelId: this.submodelId,
      position: this.position,
    };
  }
}
