import { z } from "zod";
import {
  Gs1GranularitySchema,
  UniqueProductIdentifierTypeSchema,
} from "./unique-product-identifier-type";
import { Cset82ComponentSchema, Gtin14Schema } from "./gs1/gs1-digital-link";
import { PermalinkKindSchema } from "../permalinks/permalink.dto";
import { PagingMetadataDtoSchema } from "../shared/pagination.dto";

export const UniqueProductIdentifierPermalinkSummaryDtoSchema = z
  .object({
    id: z.uuid(),
    kind: PermalinkKindSchema,
    publicUrl: z.string().url(),
  })
  .meta({ id: "UniqueProductIdentifierPermalinkSummary" });

export type UniqueProductIdentifierPermalinkSummaryDto = z.infer<
  typeof UniqueProductIdentifierPermalinkSummaryDtoSchema
>;

export const UniqueProductIdentifierListItemDtoSchema = z
  .object({
    uuid: z.uuid(),
    referenceId: z.uuid(),
    type: UniqueProductIdentifierTypeSchema,
    gtin: Gtin14Schema.nullable(),
    batch: Cset82ComponentSchema.nullish().overwrite((v) => v ?? null),
    serial: Cset82ComponentSchema.nullable()
      .nullish()
      .overwrite((v) => v ?? null),
    granularity: Gs1GranularitySchema.nullable(),
    digitalLink: z
      .string()
      .url()
      .nullish()
      .overwrite((v) => v ?? null),
    passportPublished: z.boolean(),
    permalink: UniqueProductIdentifierPermalinkSummaryDtoSchema.nullish().overwrite(
      (v) => v ?? null,
    ),
  })
  .meta({ id: "UniqueProductIdentifierListItem" });

export type UniqueProductIdentifierListItemDto = z.infer<
  typeof UniqueProductIdentifierListItemDtoSchema
>;

export const UniqueProductIdentifierListDtoSchema = z.array(
  UniqueProductIdentifierListItemDtoSchema,
);

export type UniqueProductIdentifierListDto = z.infer<typeof UniqueProductIdentifierListDtoSchema>;

export const UniqueProductIdentifierPaginationDtoSchema = z
  .object({
    ...PagingMetadataDtoSchema.shape,
    result: UniqueProductIdentifierListItemDtoSchema.array(),
  })
  .meta({ id: "UniqueProductIdentifiers" });

export type UniqueProductIdentifierPaginationDto = z.infer<
  typeof UniqueProductIdentifierPaginationDtoSchema
>;
