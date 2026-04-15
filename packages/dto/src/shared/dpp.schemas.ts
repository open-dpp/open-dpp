import { z } from "zod";
import {
  EnvironmentJsonSchema,
  ExtendedEnvironmentJsonSchema,
} from "../aas/environment-json-schema";

export const DateTimeSchema = z.union([z.iso.datetime(), z.date()]);

export const DppStatusDto = {
  Draft: "Draft",
  Published: "Published",
  Archived: "Archived",
} as const;

export const DppStatusDtoEnum = z.enum(DppStatusDto);

export const DppStatusModificationMethodDto = {
  Publish: "Publish",
  Archive: "Archive",
  Restore: "Restore",
} as const;

export const DppStatusModificationDtoEnum = z.enum(DppStatusModificationMethodDto);

export const DppStatusChangeDtoSchema = z.object({
  previousStatus: DppStatusDtoEnum.nullish(),
  currentStatus: DppStatusDtoEnum,
});

export const DppStatusModificationDtoSchema = z.object({
  method: DppStatusModificationDtoEnum,
});

export type DppStatusModificationDto = z.infer<typeof DppStatusModificationDtoSchema>;

export const SharedDppDtoSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  environment: z.union([EnvironmentJsonSchema, ExtendedEnvironmentJsonSchema]),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  lastStatusChange: DppStatusChangeDtoSchema,
});

export type SharedDppDto = z.infer<typeof SharedDppDtoSchema>;
