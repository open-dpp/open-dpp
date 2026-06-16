import { z } from "zod";
import {
  ExternalIdentifierTypeSchema,
  Gs1GranularitySchema,
} from "../gs1/external-identifier-type";
import { Cset82ComponentSchema, Gtin14Schema } from "../gs1/gs1-digital-link";
import { PagingMetadataDtoSchema } from "../shared/pagination.dto";

/**
 * Read-only snapshot of a single UniqueProductIdentifier for the org-scoped UPI list.
 *
 * - `uuid`              — the UPI's own UUID (primary key)
 * - `referenceId`       — the passport UUID this UPI belongs to
 * - `type`              — discriminator: OPEN_DPP_UUID | GS1 | GTIN | EAN
 * - `gtin`              — GTIN-14 (null for OPEN_DPP_UUID rows)
 * - `batch`             — GS1 batch / lot AI 10, CSET-82 ≤ 20 chars (null when absent)
 * - `serial`            — GS1 serial AI 21, CSET-82 ≤ 20 chars (null when absent)
 * - `granularity`       — derived: model | batch | item | null (null for non-GS1)
 * - `digitalLink`       — server-assembled GS1 Digital Link URL, or null when no resolver
 * - `passportPublished` — whether the owning passport is currently published
 *
 * No GS1 data attributes appear on this schema — the list item is a display-only snapshot.
 */
export const UniqueProductIdentifierListItemDtoSchema = z
  .object({
    uuid: z.uuid(),
    referenceId: z.uuid(),
    type: ExternalIdentifierTypeSchema,
    gtin: Gtin14Schema.nullable(),
    batch: Cset82ComponentSchema.nullable().nullish().overwrite((v) => v ?? null),
    serial: Cset82ComponentSchema.nullable().nullish().overwrite((v) => v ?? null),
    granularity: Gs1GranularitySchema.nullable(),
    digitalLink: z.string().url().nullish().overwrite((v) => v ?? null),
    passportPublished: z.boolean(),
  })
  .meta({ id: "UniqueProductIdentifierListItem" });

export type UniqueProductIdentifierListItemDto = z.infer<
  typeof UniqueProductIdentifierListItemDtoSchema
>;

/**
 * The list-level wrapper: an array of `UniqueProductIdentifierListItemDto` items.
 * `.element` is the item schema for use in API client and OpenAPI generation.
 */
export const UniqueProductIdentifierListDtoSchema = z.array(
  UniqueProductIdentifierListItemDtoSchema,
);

export type UniqueProductIdentifierListDto = z.infer<typeof UniqueProductIdentifierListDtoSchema>;

/**
 * The cursor-paginated envelope returned by `GET /unique-product-identifiers`.
 * Mirrors `PassportPaginationDtoSchema`: `paging_metadata.cursor` carries the
 * next-page cursor (null on the last page) and `result` holds the page items.
 */
export const UniqueProductIdentifierPaginationDtoSchema = z
  .object({
    ...PagingMetadataDtoSchema.shape,
    result: UniqueProductIdentifierListItemDtoSchema.array(),
  })
  .meta({ id: "UniqueProductIdentifiers" });

export type UniqueProductIdentifierPaginationDto = z.infer<
  typeof UniqueProductIdentifierPaginationDtoSchema
>;
