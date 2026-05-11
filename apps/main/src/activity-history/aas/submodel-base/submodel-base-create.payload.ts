import { IActivityPayload } from "../../activity";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod";
import { AdministrativeInformation } from "../../../aas/domain/common/administrative-information";
import { AdministrativeInformationJsonSchema } from "@open-dpp/dto";

const SubmodelBaseCreateActivityPayloadSchema = z.object({
  submodelId: z.string(),
  administration: AdministrativeInformationJsonSchema,
  fullIdShortPath: z.string(),
  position: z.number().nullish(),
  data: z.unknown(),
});

export class SubmodelBaseCreateActivityPayload implements IActivityPayload {
  private constructor(
    public readonly submodelId: string,
    public readonly administration: AdministrativeInformation,
    public readonly fullIdShortPath: IdShortPath,
    public readonly position: number | null,
    public readonly data: unknown,
  ) {}

  static create(data: {
    submodelId: string;
    administration: AdministrativeInformation;
    fullIdShortPath: IdShortPath;
    position?: number;
    data: unknown;
  }) {
    return new SubmodelBaseCreateActivityPayload(
      data.submodelId,
      data.administration,
      data.fullIdShortPath,
      data.position ?? null,
      data.data,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = SubmodelBaseCreateActivityPayloadSchema.parse(data);
    return new SubmodelBaseCreateActivityPayload(
      parsed.submodelId,
      AdministrativeInformation.fromPlain(parsed.administration),
      IdShortPath.create({ path: parsed.fullIdShortPath }),
      parsed.position ?? null,
      parsed.data,
    );
  }

  toPlain() {
    return {
      submodelId: this.submodelId,
      administration: this.administration.toPlain(),
      fullIdShortPath: this.fullIdShortPath.toString(),
      position: this.position,
      data: this.data,
    };
  }
}
