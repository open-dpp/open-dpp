import { Query } from "@nestjs/common";
import { ZodValidationPipe } from "@open-dpp/exception";
import { DigitalProductDocumentStatusDtoEnum, PopulateSchema } from "@open-dpp/dto";
import { z } from "zod/v4";

export const PopulateQueryParamSchema = PopulateSchema.meta({
  description: "Populates specified environment property",
  example: "environment.assetAdministrationShells",
  param: { in: "query", name: "populate" },
});
export const PopulateQueryParam = () =>
  Query("populate", new ZodValidationPipe(PopulateQueryParamSchema));

export const StatusQueryParamSchema = z
  .union([DigitalProductDocumentStatusDtoEnum, DigitalProductDocumentStatusDtoEnum.array()])
  .optional()
  .meta({
    description: "Filters by the specified status entries",
    example: "[Draft, Published]",
    param: { in: "query", name: "status" },
  });

export const StatusQueryParam = () =>
  Query("status", new ZodValidationPipe(StatusQueryParamSchema));
