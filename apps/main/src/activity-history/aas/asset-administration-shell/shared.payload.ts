import { z } from "zod";
import { AdministrativeInformationJsonSchema } from "@open-dpp/dto";
import { AdministrativeInformation } from "../../../aas/domain/common/administrative-information";

export const SharedAasActivityPayloadSchema = z.object({
  assetAdministrationShellId: z.string(),
  administration: AdministrativeInformationJsonSchema,
  data: z.unknown(),
});

export interface SharedAasActivityPayloadCreateProps {
  assetAdministrationShellId: string;
  administration: AdministrativeInformation;
  data: unknown;
}
