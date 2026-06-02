import { PagingMetadataDtoSchema, PagingParamsDtoSchema } from "../shared/pagination.dto";
import { z } from "zod";
import { PeriodDtoSchema } from "../shared/time.dto";
import { ChangeEventDtoTypeEnum } from "./change-event-types.dto";
import { ActivityDtoTypesEnum } from "./activity-types.dto";

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

export const ActivityPayloadDtoSchema = z.looseObject({
  changes: z
    .looseObject({
      type: ChangeEventDtoTypeEnum,
      path: z.string().optional(),
    })
    .array(),
});

export const ActivityDtoSchema = z.object({
  header: ActivityHeaderDtoSchema,
  payload: z.union([ActivityPayloadDtoSchema]),
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
  type: ActivityDtoTypesEnum.optional(),
  path: z.string().optional(),
});

export type ActivityFilterDto = z.infer<typeof ActivityFilterDtoSchema>;

export const GetAllActivitiesParamsDtoSchema = z.object({
  pagination: PagingParamsDtoSchema.optional(),
  period: PeriodDtoSchema.optional(),
  filter: ActivityFilterDtoSchema.optional(),
});

export type GetAllActivitiesParamsDto = z.infer<typeof GetAllActivitiesParamsDtoSchema>;
