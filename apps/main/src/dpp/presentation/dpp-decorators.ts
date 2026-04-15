import { Query } from "@nestjs/common";
import { ZodValidationPipe } from "@open-dpp/exception";
import { DppStatusDtoEnum, PopulateSchema } from "@open-dpp/dto";

export const PopulateQueryParamSchema = PopulateSchema.meta({
  description: "Populates specified environment property",
  example: "environment.assetAdministrationShells",
  param: { in: "query", name: "populate" },
});
export const PopulateQueryParam = () =>
  Query("populate", new ZodValidationPipe(PopulateQueryParamSchema));

export const StatusQueryParamSchema = DppStatusDtoEnum.optional().meta({
  description: "Filters by the specified status",
  example: "Draft",
  param: { in: "query", name: "status" },
});

export const StatusQueryParam = () =>
  Query("status", new ZodValidationPipe(StatusQueryParamSchema));
