import { PagingMetadataDtoSchema } from "../shared/pagination.dto";
import { z } from "zod";

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
  .meta({ id: "Passports" });

export type ActivityPaginationDto = z.infer<typeof ActivityPaginationDtoSchema>;
