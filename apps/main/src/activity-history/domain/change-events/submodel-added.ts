import { IChangeEvent, IChangeEventWithPath } from "./change-event";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { SubmodelJsonSchema } from "@open-dpp/dto";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";

const SubmodelAddedSchema = z.object({
  type: z.literal(ChangeEventTypes.SubmodelAdded),
  path: z.string(),
  value: SubmodelJsonSchema,
});

export class SubmodelAdded implements IChangeEventWithPath {
  public readonly type = ChangeEventTypes.SubmodelAdded;

  private constructor(
    public readonly path: IdShortPath,
    public readonly value: Submodel,
  ) {}

  static create(data: { submodel: Submodel }) {
    return new SubmodelAdded(data.submodel.getIdShortPath(), data.submodel);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = SubmodelAddedSchema.parse(data);
    return new SubmodelAdded(
      IdShortPath.create({ path: parsed.path }),
      Submodel.fromPlain(parsed.value),
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
