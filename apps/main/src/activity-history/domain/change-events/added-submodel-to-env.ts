import { IChangeEvent, IChangeEventWithPath } from "./change-event";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";

const AddedSubmodelToEnvSchema = z.object({
  type: z.literal(ChangeEventTypes.AddedSubmodelToEnv),
  position: z.number(),
  submodelId: z.string(),
  path: z.string(),
});

export class AddedSubmodelToEnv implements IChangeEventWithPath {
  public readonly type = ChangeEventTypes.AddedSubmodelToEnv;

  private constructor(
    public readonly submodelId: string,
    public readonly position: number,
    public readonly path: IdShortPath,
  ) {}

  static create(data: { position: number; submodel: Submodel }) {
    return new AddedSubmodelToEnv(data.submodel.id, data.position, data.submodel.getIdShortPath());
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = AddedSubmodelToEnvSchema.parse(data);
    return new AddedSubmodelToEnv(
      parsed.submodelId,
      parsed.position,
      IdShortPath.create({ path: parsed.path }),
    );
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      submodelId: this.submodelId,
      position: this.position,
      path: this.path.toString(),
    };
  }
}
