import { z } from "zod";

export const OfficialTemplateImportSuccessDtoSchema = z.object({
  fileName: z.string(),
  templateId: z.string(),
});
export type OfficialTemplateImportSuccessDto = z.infer<
  typeof OfficialTemplateImportSuccessDtoSchema
>;

export const OfficialTemplateImportFailureDtoSchema = z.object({
  fileName: z.string(),
  reason: z.string(),
});
export type OfficialTemplateImportFailureDto = z.infer<
  typeof OfficialTemplateImportFailureDtoSchema
>;

export const ImportOfficialTemplatesResultDtoSchema = z
  .object({
    imported: OfficialTemplateImportSuccessDtoSchema.array(),
    failed: OfficialTemplateImportFailureDtoSchema.array(),
  })
  .meta({ id: "ImportOfficialTemplatesResult" });
export type ImportOfficialTemplatesResultDto = z.infer<
  typeof ImportOfficialTemplatesResultDtoSchema
>;
