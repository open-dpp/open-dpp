import { PagingMetadataDtoSchema, PagingParamsDtoSchema } from "../shared/pagination.dto";
import { z } from "zod";
import { PeriodDtoSchema } from "../shared/time.dto";

export const ActivityDtoTypes = {
  SubmodelActivity: "SubmodelActivity",
  AssetAdministrationShellActivity: "AssetAdministrationShellActivity",
  EnvironmentActivity: "EnvironmentActivity",
  SubmodelRepositoryActivity: "SubmodelRepositoryActivity",
  DigitalProductDocumentActivity: "DigitalProductDocumentActivity",
} as const;
export const ActivityDtoTypesEnum = z.enum(ActivityDtoTypes);
export type ActivityDtoTypesType = z.infer<typeof ActivityDtoTypesEnum>;

export const ActivityHeaderDtoSchema = z.object({
  id: z.string(),
  aggregateId: z.string(),
  correlationId: z.string().nullable(),
  createdAt: z.iso.datetime(),
  type: ActivityDtoTypesEnum,
  userId: z.string().nullable(),
  version: z.string(),
  exportVersion: z.string(),
});

export const OperationDtoTypes = {
  Add: "add",
  Remove: "remove",
  Replace: "replace",
  Move: "move",
  Copy: "copy",
  Test: "test",
} as const;
export const OperationDtoTypeEnum = z.enum(OperationDtoTypes);
export type OperationDtoTypesType = z.infer<typeof OperationDtoTypeEnum>;

// Base schema JsonPatch operation specified by RFC 6902 from the IETF (https://jsonpatch.com/)
export const JsonPatchOperationDtoSchema = z.object({
  op: OperationDtoTypeEnum,
  path: z.string(),
  // "from" is only required for move/copy
  from: z.string().optional(),

  // value is optional depending on op
  value: z.any().optional(),
});
export type JsonPatchOperationDto = z.infer<typeof JsonPatchOperationDtoSchema>;

// Extended JsonPatch operation with the dpp field which contains relevant dpp identifiers like the idShortPath
export const ExtendedJsonPatchOperationDtoSchema = JsonPatchOperationDtoSchema.extend({
  dpp: z.string(),
});
export type ExtendedJsonPatchDtoOperation = z.infer<typeof ExtendedJsonPatchOperationDtoSchema>;

export const ActivityDtoSchema = z.object({
  header: ActivityHeaderDtoSchema,
  payload: z.looseObject({
    changes: z.union([ExtendedJsonPatchOperationDtoSchema.array(), z.any()]),
  }),
});

export type ActivityDto = z.infer<typeof ActivityDtoSchema>;

export const ActivityPaginationDtoSchema = z
  .object({
    ...PagingMetadataDtoSchema.shape,
    result: ActivityDtoSchema.array(),
  })
  .meta({ id: "Activities" });

export type ActivityPaginationDto = z.infer<typeof ActivityPaginationDtoSchema>;

export const ActivityFilterDtoSchema = z.object({
  type: ActivityDtoTypesEnum,
  dppKey: z.string().optional(),
});

export type ActivityFilterDto = z.infer<typeof ActivityFilterDtoSchema>;

export const GetAllActivitiesParamsDtoSchema = z.object({
  pagination: PagingParamsDtoSchema.optional(),
  period: PeriodDtoSchema.optional(),
  filter: ActivityFilterDtoSchema.optional(),
});

export type GetAllActivitiesParamsDto = z.infer<typeof GetAllActivitiesParamsDtoSchema>;
