import { z } from "zod";

/**
 * Wire shape of an organization. The internal `slug` (always equal to `id`)
 * and better-auth's `members` array are deliberately not part of it.
 */
export const OrganizationDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** @deprecated Use the organization's Branding logo instead. */
  logo: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.iso.datetime(),
});

export type OrganizationDto = z.infer<typeof OrganizationDtoSchema>;

/**
 * Body of `POST /organizations`. A `slug` sent by legacy callers is stripped:
 * the server derives it from the organization id.
 */
export const OrganizationCreateDtoSchema = z.object({
  name: z.string().trim().min(1),
});

export type OrganizationCreateDto = z.infer<typeof OrganizationCreateDtoSchema>;
