import { IActivityPayload } from "../../activity";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod";
import { AdministrativeInformation } from "../../../aas/domain/common/administrative-information";
import { AdministrativeInformationJsonSchema } from "@open-dpp/dto";

const SubmodelBaseModificationActivityPayloadSchema = z.object({
  submodelId: z.string(),
  administration: AdministrativeInformationJsonSchema,
  fullIdShortPath: z.string(),
  data: z.unknown(),
});

export class SubmodelBaseModificationActivityPayload implements IActivityPayload {
  private constructor(
    public readonly submodelId: string,
    public readonly administration: AdministrativeInformation,
    public readonly fullIdShortPath: IdShortPath,
    public readonly data: unknown,
  ) {}

  static create(data: {
    submodelId: string;
    administration: AdministrativeInformation;
    fullIdShortPath: IdShortPath;
    data: unknown;
  }) {
    return new SubmodelBaseModificationActivityPayload(
      data.submodelId,
      data.administration,
      data.fullIdShortPath,
      data.data,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = SubmodelBaseModificationActivityPayloadSchema.parse(data);
    return new SubmodelBaseModificationActivityPayload(
      parsed.submodelId,
      AdministrativeInformation.fromPlain(parsed.administration),
      IdShortPath.create({ path: parsed.fullIdShortPath }),
      parsed.data,
    );
  }

  toPlain() {
    return {
      submodelId: this.submodelId,
      administration: this.administration.toPlain(),
      fullIdShortPath: this.fullIdShortPath.toString(),
      data: this.data,
    };
  }
}
