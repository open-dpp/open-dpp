import { IActivityPayload } from "../../activity";
import { AdministrativeInformation } from "../../../aas/domain/common/administrative-information";
import {
  SharedAasActivityPayloadCreateProps,
  SharedAasActivityPayloadSchema,
} from "./shared.payload";

const SubmodelCreateActivityPayloadSchema = SharedAasActivityPayloadSchema;

export class SubmodelCreateActivityPayload implements IActivityPayload {
  private constructor(
    public readonly assetAdministrationShellId: string,
    public readonly administration: AdministrativeInformation,
    public readonly data: unknown,
  ) {}

  static create(data: SharedAasActivityPayloadCreateProps) {
    return new SubmodelCreateActivityPayload(
      data.assetAdministrationShellId,
      data.administration,
      data.data,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = SubmodelCreateActivityPayloadSchema.parse(data);
    return new SubmodelCreateActivityPayload(
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
