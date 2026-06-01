import { IChangeEvent, IChangeEventWithPath } from "./change-event";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { Submodel } from "../../../aas/domain/submodel-base/submodel";
import { SubmodelJsonSchema } from "@open-dpp/dto";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";

const SubmodelDeletedSchema = z.object({
  type: z.literal(ChangeEventTypes.SubmodelDeleted),
  value: SubmodelJsonSchema,
  path: z.string(),
});

export class SubmodelDeleted implements IChangeEventWithPath {
  public readonly type = ChangeEventTypes.SubmodelDeleted;

  private constructor(
    public readonly path: IdShortPath,
    public readonly value: Submodel,
  ) {}

  static create(data: { submodel: Submodel }) {
    return new SubmodelDeleted(data.submodel.getIdShortPath(), data.submodel);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = SubmodelDeletedSchema.parse(data);
    return new SubmodelDeleted(
      IdShortPath.create({ path: parsed.path }),
      Submodel.fromPlain(parsed.value),
    );
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      path: this.path.toString(),
      value: this.value.toPlain(),
    };
  }
}
