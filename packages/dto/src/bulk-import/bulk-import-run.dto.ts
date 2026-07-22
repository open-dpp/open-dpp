import { z } from "zod";
import { DateTimeSchema } from "../shared/digital-product-document.schemas";
import { PagingMetadataDtoSchema } from "../shared/pagination.dto";

export const BulkImportRunStatusDto = {
  Pending: "pending",
  Running: "running",
  Completed: "completed",
  CompletedWithErrors: "completed_with_errors",
  Interrupted: "interrupted",
} as const;

export const BulkImportRunStatusDtoEnum = z.enum(BulkImportRunStatusDto);
export type BulkImportRunStatusDtoType = z.infer<typeof BulkImportRunStatusDtoEnum>;

export const BulkImportRunDtoSchema = z.object({
  id: z.uuid(),
  bulkImportConfigId: z.uuid(),
  organizationId: z.string(),
  status: BulkImportRunStatusDtoEnum,
  userId: z.string(),
  totalCount: z.number(),
  succeededCount: z.number(),
  failedCount: z.number(),
  startedAt: DateTimeSchema.nullish(),
  finishedAt: DateTimeSchema.nullish(),
  createdAt: DateTimeSchema,
});

export type BulkImportRunDto = z.infer<typeof BulkImportRunDtoSchema>;

export const BulkImportRunPaginationDtoSchema = z
  .object({
    ...PagingMetadataDtoSchema.shape,
    result: BulkImportRunDtoSchema.array(),
  })
  .meta({ id: "BulkImportRuns" });

export type BulkImportRunPaginationDto = z.infer<typeof BulkImportRunPaginationDtoSchema>;

export const BulkImportRunCreateDtoSchema = z.object({
  rows: z.record(z.string(), z.unknown()).array().min(1).max(1000),
});

export type BulkImportRunCreateDto = z.input<typeof BulkImportRunCreateDtoSchema>;
