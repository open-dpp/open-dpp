import { IChangeEvent } from "./change-event";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";

const AddedSubmodelToEnvSchema = z.object({
  type: z.literal(ChangeEventTypes.AddedSubmodelToEnv),
  position: z.number(),
  submodelId: z.string(),
});

export class AddedSubmodelToEnv implements IChangeEvent {
  public readonly type = ChangeEventTypes.AddedSubmodelToEnv;

  private constructor(
    public readonly submodelId: string,
    public readonly position: number,
  ) {}

  static create(data: { position: number; submodel: Submodel }) {
    return new AddedSubmodelToEnv(data.submodel.id, data.position);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = AddedSubmodelToEnvSchema.parse(data);
    return new AddedSubmodelToEnv(parsed.submodelId, parsed.position);
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      submodelId: this.submodelId,
      position: this.position,
    };
  }
}
