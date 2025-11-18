import type { Model } from "../../domain/model";
import { z } from "zod";
import {
  DataValueDtoSchema,
  dataValueToDto,
} from "../../../product-passport-data/presentation/dto/data-value.dto";
import {
  UniqueProductIdentifierDtoSchema,
  uniqueProductIdentifierToDto,
} from "../../../unique-product-identifier/presentation/dto/unique-product-identifier-dto.schema";

export const ModelDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  mediaReferences: z.string().array(),
  description: z.string().optional(),
  uniqueProductIdentifiers: UniqueProductIdentifierDtoSchema.array(),
  templateId: z.uuid(),
  dataValues: DataValueDtoSchema.array(),
  owner: z.string(),
});

export type ModelDto = z.infer<typeof ModelDtoSchema>;

export function modelToDto(model: Model): ModelDto {
  return ModelDtoSchema.parse({
    id: model.id,
    name: model.name,
    mediaReferences: model.mediaReferences,
    description: model.description,
    dataValues: model.dataValues.map(d => dataValueToDto(d)),
    owner: model.createdByUserId,
    uniqueProductIdentifiers: model.uniqueProductIdentifiers.map(u =>
      uniqueProductIdentifierToDto(u),
    ),
    templateId: model.templateId,
  });
}

export const MediaReferenceDtoSchema = z.object({
  id: z.uuid(),
});

export type MediaReferenceDto = z.infer<typeof MediaReferenceDtoSchema>;

export const MediaReferencePositionDtoSchema = z.object({
  position: z.number(),
});

export type MediaReferencePositionDto = z.infer<
  typeof MediaReferencePositionDtoSchema
>;
