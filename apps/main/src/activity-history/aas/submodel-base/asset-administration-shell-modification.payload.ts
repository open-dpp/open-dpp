import { IActivityPayload } from "../../activity";
import { z } from "zod";

const AssetAdministrationShellModificationActivityPayloadSchema = z.object({
  assetAdministrationShellId: z.string(),
  data: z.unknown(),
});

export class AssetAdministrationShellModificationActivityPayload implements IActivityPayload {
  private constructor(
    public readonly assetAdministrationShellId: string,
    public readonly data: unknown,
  ) {}

  static create(data: { assetAdministrationShellId: string; data: unknown }) {
    return new AssetAdministrationShellModificationActivityPayload(
      data.assetAdministrationShellId,
      data.data,
    );
  }

  static fromPlain(data: unknown) {
    const parsed = AssetAdministrationShellModificationActivityPayloadSchema.parse(data);
    return new AssetAdministrationShellModificationActivityPayload(
      parsed.assetAdministrationShellId,
      parsed.data,
    );
  }

  toPlain() {
    return {
      assetAdministrationShellId: this.assetAdministrationShellId,
      data: this.data,
    };
  }
}
