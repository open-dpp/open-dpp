import { PagingMetadataDtoSchema, PagingParamsDtoSchema } from "../shared/pagination.dto";
import { z } from "zod";
import { PeriodDtoSchema } from "../shared/time.dto";

export const ActivityDtoTypes = {
  SubmodelElementModification: "SubmodelElementModification",
} as const;
export const ActivityDtoTypesEnum = z.enum(ActivityDtoTypes);
export type ActivityDtoTypesType = z.infer<typeof ActivityDtoTypesEnum>;

export const ActivityHeaderDtoSchema = z.object({
  id: z.string(),
  aggregateId: z.string(),
  correlationId: z.string(),
  createdAt: z.date(),
  type: z.string(),
  userId: z.string().nullable(),
  version: z.string(),
});

export const ActivityDtoSchema = z.object({
  header: ActivityHeaderDtoSchema,
  payload: z.any(),
});

export type ActivityDto = z.infer<typeof ActivityDtoSchema>;

export const ActivityPaginationDtoSchema = z
  .object({
    ...PagingMetadataDtoSchema.shape,
    result: ActivityDtoSchema.array(),
  })
  .meta({ id: "Activities" });

export type ActivityPaginationDto = z.infer<typeof ActivityPaginationDtoSchema>;

export const GetAllActivitiesParamsDtoSchema = z.object({
  pagination: PagingParamsDtoSchema.optional(),
  period: PeriodDtoSchema.optional(),
});

export type GetAllActivitiesParamsDto = z.infer<typeof GetAllActivitiesParamsDtoSchema>;
