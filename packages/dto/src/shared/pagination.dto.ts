import { z } from "zod";

export const PagingMetadataDtoSchema = z.object({
  paging_metadata: z.object({
    cursor: z.string().nullable(),
    // Total number of items across all pages. Only present for endpoints that compute it
    // (organization-scoped lists); optional so other paginated endpoints stay compatible.
    total_count: z.number().optional(),
  }),
});

export const PagingParamsDtoSchema = z.object({
  limit: z.number().optional(),
  cursor: z.string().optional(),
});

export type PagingParamsDto = z.infer<typeof PagingParamsDtoSchema>;
export type PagingMetadataDto = z.infer<typeof PagingMetadataDtoSchema>;
