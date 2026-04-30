import { applyDecorators, Get, Query } from "@nestjs/common";
import { ZodValidationPipe } from "@open-dpp/exception";
import { DigitalProductDocumentStatusDtoEnum, PopulateSchema } from "@open-dpp/dto";
import { z } from "zod/v4";

export const ApiGetActivitiesPath = "/:id/activities";
export function ApiGetActivities() {
  return applyDecorators(Get(ApiGetActivitiesPath));
}

export const PopulateQueryParamSchema = PopulateSchema.meta({
  description: "Populates specified environment property",
  example: "environment.assetAdministrationShells",
  param: { in: "query", name: "populate" },
});
export const PopulateQueryParam = () =>
  Query("populate", new ZodValidationPipe(PopulateQueryParamSchema));

export const StatusQueryParamSchema = z
  .union([DigitalProductDocumentStatusDtoEnum, DigitalProductDocumentStatusDtoEnum.array()])
  .transform((val) => (Array.isArray(val) ? val : [val]))
  .optional()
  .meta({
    description: "Filters by the specified status entries",
    example: "[Draft, Published]",
    param: { in: "query", name: "status" },
  });

export const StatusQueryParam = () =>
  Query("status", new ZodValidationPipe(StatusQueryParamSchema));

export const LimitQueryParamSchema = z.coerce
  .number()
  .optional()
  .meta({
    description: "The maximum number of elements in the response array",
    example: 10,
    param: { in: "query", name: "limit" },
  });
export const LimitQueryParam = () => Query("limit", new ZodValidationPipe(LimitQueryParamSchema));
