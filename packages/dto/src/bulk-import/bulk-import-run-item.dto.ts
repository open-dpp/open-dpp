import { z } from "zod";
import { PagingMetadataDtoSchema } from "../shared/pagination.dto";

export const BulkImportRunItemStatusDto = {
  Pending: "pending",
  Created: "created",
  Updated: "updated",
  Failed: "failed",
} as const;

export const BulkImportRunItemStatusDtoEnum = z.enum(BulkImportRunItemStatusDto);
export type BulkImportRunItemStatusDtoType = z.infer<typeof BulkImportRunItemStatusDtoEnum>;

export const BulkImportRunItemDtoSchema = z.object({
  id: z.uuid(),
  runId: z.string(),
  rowIndex: z.number(),
  inputData: z.record(z.string(), z.unknown()),
  status: BulkImportRunItemStatusDtoEnum,
  passportId: z.string().nullish(),
  error: z.string().nullish(),
});

export type BulkImportRunItemDto = z.infer<typeof BulkImportRunItemDtoSchema>;

export const BulkImportRunItemPaginationDtoSchema = z
  .object({
    ...PagingMetadataDtoSchema.shape,
    result: BulkImportRunItemDtoSchema.array(),
  })
  .meta({ id: "BulkImportRunItems" });

export type BulkImportRunItemPaginationDto = z.infer<typeof BulkImportRunItemPaginationDtoSchema>;
