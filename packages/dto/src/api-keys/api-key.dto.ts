import { z } from "zod";
import { PagingMetadataDtoSchema } from "../shared/pagination.dto";

export const ApiKeyExpiryPresetDays = [30, 90, 180, 365] as const;

export const ApiKeyDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  // First characters of the key (incl. prefix) for masked display; null when not stored.
  start: z.string().nullable(),
  expiresAt: z.iso.datetime().nullable(),
  lastUsedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export type ApiKeyDto = z.infer<typeof ApiKeyDtoSchema>;

// The plain key is only returned once, directly after creation.
export const CreatedApiKeyDtoSchema = ApiKeyDtoSchema.extend({
  key: z.string(),
});

export type CreatedApiKeyDto = z.infer<typeof CreatedApiKeyDtoSchema>;

export const CreateApiKeyDtoSchema = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.literal(ApiKeyExpiryPresetDays),
});

export type CreateApiKeyDto = z.infer<typeof CreateApiKeyDtoSchema>;

export const UpdateApiKeyDtoSchema = z.object({
  name: z.string().min(1).max(100),
});

export type UpdateApiKeyDto = z.infer<typeof UpdateApiKeyDtoSchema>;

export const ApiKeyPaginationDtoSchema = z
  .object({
    ...PagingMetadataDtoSchema.shape,
    result: ApiKeyDtoSchema.array(),
  })
  .meta({ id: "ApiKeys" });

export type ApiKeyPaginationDto = z.infer<typeof ApiKeyPaginationDtoSchema>;
