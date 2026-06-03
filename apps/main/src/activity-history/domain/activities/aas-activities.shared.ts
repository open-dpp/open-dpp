import { ChangeEventSchema, IChangeEvent, parseChangeEvent } from "../change-events/change-event";
import { z } from "zod";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { filterChangesByAbility, IActivityPayload } from "./shared.activity";

const PayloadSchema = z.object({
  aasId: z.string(),
  changes: ChangeEventSchema.array(),
});

export class AssetAdministrationShellActivityPayload implements IActivityPayload {
  private constructor(
    public readonly aasId: string,
    public readonly changes: IChangeEvent[],
  ) {}
  static create(data: { aasId: string; changes: IChangeEvent[] }) {
    return new AssetAdministrationShellActivityPayload(data.aasId, data.changes);
  }
  static fromPlain(data: unknown) {
    const parsed = PayloadSchema.parse(data);
    return new AssetAdministrationShellActivityPayload(
      parsed.aasId,
      parsed.changes.map(parseChangeEvent),
    );
  }
  toPlain(options?: ConvertToPlainOptions) {
    return {
      aasId: this.aasId,
      changes: filterChangesByAbility(this.changes, options).map((change) =>
        change.toPlain(options),
      ),
    };
  }

  isNoop(): boolean {
    return this.changes.every((change) => change.isNoop());
  }
}
