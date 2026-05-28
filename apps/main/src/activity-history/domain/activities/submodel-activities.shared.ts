import { ChangeEventSchema, IChangeEvent, parseChangeEvent } from "../change-events/change-event";
import { IActivityPayload } from "./activity";
import { z } from "zod";

const PayloadSchema = z.object({
  submodelId: z.string(),
  changes: ChangeEventSchema.array(),
});

export class SubmodelActivityPayload implements IActivityPayload {
  private constructor(
    public readonly submodelId: string,
    public readonly changes: IChangeEvent[],
  ) {}
  static create(data: { submodelId: string; changes: IChangeEvent[] }) {
    return new SubmodelActivityPayload(data.submodelId, data.changes);
  }
  static fromPlain(data: unknown) {
    const parsed = PayloadSchema.parse(data);
    return new SubmodelActivityPayload(parsed.submodelId, parsed.changes.map(parseChangeEvent));
  }
  toPlain() {
    return {
      submodelId: this.submodelId,
      changes: this.changes.map((change) => change.toPlain()),
    };
  }
}
