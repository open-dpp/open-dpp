import { z } from "zod";
import { DateTimeSchema } from "../shared/digital-product-document.schemas";
import { PagingMetadataDtoSchema } from "../shared/pagination.dto";

export const FieldMappingDtoSchema = z.object({
  input: z.string(),
  output: z.string(),
});

export type FieldMappingDto = z.infer<typeof FieldMappingDtoSchema>;

export const SubmodelFieldMappingDtoSchema = z.object({
  submodelIdShort: z.string(),
  fieldMappings: FieldMappingDtoSchema.array(),
});

export type SubmodelFieldMappingDto = z.infer<typeof SubmodelFieldMappingDtoSchema>;

export const BulkImportConfigDtoSchema = z.object({
  id: z.uuid(),
  organizationId: z.string(),
  templateId: z.uuid(),
  name: z.string(),
  idField: z.string(),
  submodelMappings: SubmodelFieldMappingDtoSchema.array(),
  inputSample: z.record(z.string(), z.unknown()).nullish(),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export type BulkImportConfigDto = z.infer<typeof BulkImportConfigDtoSchema>;

export const BulkImportConfigPaginationDtoSchema = z
  .object({
    ...PagingMetadataDtoSchema.shape,
    result: BulkImportConfigDtoSchema.array(),
  })
  .meta({ id: "BulkImportConfigs" });

export type BulkImportConfigPaginationDto = z.infer<typeof BulkImportConfigPaginationDtoSchema>;

export const BulkImportConfigCreateDtoSchema = z.object({
  templateId: z.uuid(),
  name: z.string(),
  idField: z.string(),
  submodelMappings: SubmodelFieldMappingDtoSchema.array(),
  inputSample: z.record(z.string(), z.unknown()).nullish(),
});

export type BulkImportConfigCreateDto = z.input<typeof BulkImportConfigCreateDtoSchema>;

export const BulkImportConfigUpdateDtoSchema = BulkImportConfigCreateDtoSchema.omit({
  templateId: true,
});

export type BulkImportConfigUpdateDto = z.input<typeof BulkImportConfigUpdateDtoSchema>;
