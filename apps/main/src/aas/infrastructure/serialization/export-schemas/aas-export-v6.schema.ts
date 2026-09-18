import { z } from "zod";
import { PassportEditingModeDtoEnum } from "@open-dpp/dto";
import { AasExportVersion } from "./aas-export-shared";
import { aasExportSchemaJsonV5_0 } from "./aas-export-v5.schema";

export const aasExportSchemaJsonV6Base = z.object({
  ...aasExportSchemaJsonV5_0.shape,
  version: z.literal(AasExportVersion.v6_0),
});

export const aasExportSchemaJsonTemplateV6_0 = aasExportSchemaJsonV6Base.extend({
  passportEditingMode: PassportEditingModeDtoEnum.optional(),
});

export const aasExportSchemaJsonPassportV6_0 = aasExportSchemaJsonV6Base.extend({
  editingMode: PassportEditingModeDtoEnum.optional(),
});
