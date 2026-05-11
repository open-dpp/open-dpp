import { IActivityPayload } from "../../activity";
import { z } from "zod";
import { AdministrativeInformationJsonSchema } from "@open-dpp/dto";
import { AdministrativeInformation } from "../../../aas/domain/common/administrative-information";

const AssetAdministrationShellModificationActivityPayloadSchema = z.object({
  assetAdministrationShellId: z.string(),
  administration: AdministrativeInformationJsonSchema,
  data: z.unknown(),
});

export class AssetAdministrationShellModificationActivityPayload implements IActivityPayload {
  private constructor(
    public readonly assetAdministrationShellId: string,
    public readonly administration: AdministrativeInformation,
    public readonly data: unknown,
  ) {}

  static create(data: {
    assetAdministrationShellId: string;
    administration: AdministrativeInformation;
    data: unknown;
  }) {
    return new AssetAdministrationShellModificationActivityPayload(
      data.assetAdministrationShellId,
      data.administration,
      data.data,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = AssetAdministrationShellModificationActivityPayloadSchema.parse(data);
    return new AssetAdministrationShellModificationActivityPayload(
      parsed.assetAdministrationShellId,
      AdministrativeInformation.fromPlain(parsed.administration),
      parsed.data,
    );
  }

  toPlain() {
    return {
      assetAdministrationShellId: this.assetAdministrationShellId,
      administration: this.administration.toPlain(),
      data: this.data,
    };
  }
}
