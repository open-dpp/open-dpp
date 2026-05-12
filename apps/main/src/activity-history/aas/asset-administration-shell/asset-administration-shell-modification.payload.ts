import { IActivityPayload } from "../../activity";
import { AdministrativeInformation } from "../../../aas/domain/common/administrative-information";
import {
  SharedAasActivityPayloadCreateProps,
  SharedAasActivityPayloadSchema,
} from "./shared.payload";

const AssetAdministrationShellModificationActivityPayloadSchema = SharedAasActivityPayloadSchema;

export class AssetAdministrationShellModificationActivityPayload implements IActivityPayload {
  private constructor(
    public readonly assetAdministrationShellId: string,
    public readonly administration: AdministrativeInformation,
    public readonly data: unknown,
  ) {}

  static create(data: SharedAasActivityPayloadCreateProps) {
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
