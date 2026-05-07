import { IActivityPayload } from "../../activity";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod";

const SubmodelBaseModificationActivityPayloadSchema = z.object({
  submodelId: z.string(),
  fullIdShortPath: z.string(),
  data: z.unknown(),
});

export class SubmodelBaseModificationActivityPayload implements IActivityPayload {
  private constructor(
    public readonly submodelId: string,
    public readonly fullIdShortPath: IdShortPath,
    public readonly data: unknown,
  ) {}

  static create(data: { submodelId: string; fullIdShortPath: IdShortPath; data: unknown }) {
    return new SubmodelBaseModificationActivityPayload(
      data.submodelId,
      data.fullIdShortPath,
      data.data,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = SubmodelBaseModificationActivityPayloadSchema.parse(data);
    return new SubmodelBaseModificationActivityPayload(
      parsed.submodelId,
      IdShortPath.create({ path: parsed.fullIdShortPath }),
      parsed.data,
    );
  }

  toPlain() {
    return {
      submodelId: this.submodelId,
      fullIdShortPath: this.fullIdShortPath.toString(),
      data: this.data,
    };
  }
}
