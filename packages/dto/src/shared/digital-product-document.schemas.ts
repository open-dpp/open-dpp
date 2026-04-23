import { z } from "zod";
import {
  EnvironmentJsonSchema,
  ExtendedEnvironmentJsonSchema,
} from "../aas/environment-json-schema";

export const DateTimeSchema = z.union([z.iso.datetime(), z.date()]);

export const DigitalProductDocumentStatusDto = {
  Draft: "Draft",
  Published: "Published",
  Archived: "Archived",
} as const;

export const DigitalProductDocumentStatusDtoEnum = z.enum(DigitalProductDocumentStatusDto);
export type DigitalProductDocumentStatusDtoType = z.infer<
  typeof DigitalProductDocumentStatusDtoEnum
>;

export const DigitalProductDocumentStatusModificationMethodDto = {
  Publish: "Publish",
  Archive: "Archive",
  Restore: "Restore",
} as const;

export const DigitalProductDocumentStatusModificationDtoEnum = z.enum(
  DigitalProductDocumentStatusModificationMethodDto,
);

// `previousStatus == null` represents a loaded/created entity in its current
// state — no transition has occurred, so there is nothing to validate. Only
// when `previousStatus` is set do we enforce that `currentStatus` is a legal
// successor.
export const DigitalProductDocumentStatusChangeDtoSchema = z
  .object({
    previousStatus: DigitalProductDocumentStatusDtoEnum.nullish(),
    currentStatus: DigitalProductDocumentStatusDtoEnum,
  })
  .refine(
    (change) => {
      const { previousStatus, currentStatus } = change;
      if (previousStatus == null) return true;
      const { Draft, Published, Archived } = DigitalProductDocumentStatusDto;
      if (previousStatus === Draft)
        return currentStatus === Published || currentStatus === Archived;
      if (previousStatus === Published) return currentStatus === Archived;
      return currentStatus === Draft || currentStatus === Published;
    },
    {
      error: "Illegal status transition",
      path: ["currentStatus"],
    },
  );

export const DigitalProductDocumentStatusModificationDtoSchema = z.object({
  method: DigitalProductDocumentStatusModificationDtoEnum,
});

export type DigitalProductDocumentStatusModificationDto = z.infer<
  typeof DigitalProductDocumentStatusModificationDtoSchema
>;

export const DigitalProductDocumentDtoSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  environment: z.union([EnvironmentJsonSchema, ExtendedEnvironmentJsonSchema]),
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
  lastStatusChange: DigitalProductDocumentStatusChangeDtoSchema,
});

export type DigitalProductDocumentDto = z.infer<typeof DigitalProductDocumentDtoSchema>;
