import { ChangeEventSchema, IChangeEvent, parseChangeEvent } from "../change-events/change-event";
import { IActivityPayload } from "./activity";
import { z } from "zod";

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
  toPlain() {
    return {
      aasId: this.aasId,
      changes: this.changes.map((change) => change.toPlain()),
    };
  }
}
