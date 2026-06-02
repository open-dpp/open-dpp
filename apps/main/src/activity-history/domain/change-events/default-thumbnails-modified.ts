import { IChangeEvent } from "./change-event";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { Resource } from "../../../aas/domain/resource";
import { ResourceJsonSchema } from "@open-dpp/dto";

const DefaultThumbnailsModifiedSchema = z.object({
  type: z.literal(ChangeEventTypes.DefaultThumbnailsModified),
  oldValue: ResourceJsonSchema.array(),
  newValue: ResourceJsonSchema.array(),
});

export class DefaultThumbnailsModified implements IChangeEvent {
  public readonly type = ChangeEventTypes.DefaultThumbnailsModified;
  private constructor(
    public readonly oldValue: Resource[],
    public readonly newValue: Resource[],
  ) {}

  static create(data: { oldValue: Resource[]; newValue: Resource[] }) {
    return new DefaultThumbnailsModified(data.oldValue, data.newValue);
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = DefaultThumbnailsModifiedSchema.parse(data);
    return new DefaultThumbnailsModified(
      parsed.oldValue.map(Resource.fromPlain),
      parsed.newValue.map(Resource.fromPlain),
    );
  }

  toPlain(options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      oldValue: this.oldValue.map((r) => r.toPlain(options)),
      newValue: this.newValue.map((r) => r.toPlain(options)),
    };
  }
}
