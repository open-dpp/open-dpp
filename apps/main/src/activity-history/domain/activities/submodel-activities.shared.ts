import { ChangeEventSchema, IChangeEvent, parseChangeEvent } from "../change-events/change-event";
import { z } from "zod";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { filterChangesByAbility, IActivityPayload } from "./shared.activity";

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

  isNoop(): boolean {
    return this.changes.every((change) => change.isNoop());
  }

  toPlain(options?: ConvertToPlainOptions) {
    return {
      submodelId: this.submodelId,
      changes: filterChangesByAbility(this.changes, options).map((change) =>
        change.toPlain(options),
      ),
    };
  }
}

const PayloadWithAasSchema = PayloadSchema.extend({
  aasId: z.string(),
});

export class SubmodelWithAasActivityPayload implements IActivityPayload {
  private constructor(
    public readonly submodelId: string,
    public readonly aasId: string,
    public readonly changes: IChangeEvent[],
  ) {}
  static create(data: { submodelId: string; aasId: string; changes: IChangeEvent[] }) {
    return new SubmodelWithAasActivityPayload(data.submodelId, data.aasId, data.changes);
  }
  static fromPlain(data: unknown) {
    const parsed = PayloadWithAasSchema.parse(data);
    return new SubmodelWithAasActivityPayload(
      parsed.submodelId,
      parsed.aasId,
      parsed.changes.map(parseChangeEvent),
    );
  }
  isNoop(): boolean {
    return this.changes.every((change) => change.isNoop());
  }

  toPlain(options?: ConvertToPlainOptions) {
    return {
      submodelId: this.submodelId,
      aasId: this.aasId,
      changes: filterChangesByAbility(this.changes, options).map((change) => change.toPlain()),
    };
  }
}
