import { z } from "zod";
import { DisplayLanguage, DisplayLanguageEnum } from "../users/display-language.dto";

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
 * Owner to provision together with the organization (instance admins only).
 * The email is lowercased because better-auth stores emails lowercased, so the
 * lookup is an exact match. `locale` selects the language of the owner's mails
 * and becomes the preferred language of a newly created user.
 */
export const OrganizationOwnerDtoSchema = z.object({
  email: z.email().toLowerCase(),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  locale: DisplayLanguageEnum.default(DisplayLanguage.en),
});

export type OrganizationOwnerDto = z.infer<typeof OrganizationOwnerDtoSchema>;

/**
 * Body of `POST /organizations`. A `slug` or `metadata` sent by legacy callers is
 * stripped: the server derives the slug from the organization id and stores no
 * caller-provided metadata. `owner` is accepted from instance admins only.
 */
export const OrganizationCreateDtoSchema = z.object({
  name: z.string().trim().min(1),
  owner: OrganizationOwnerDtoSchema.optional(),
});

export type OrganizationCreateDto = z.infer<typeof OrganizationCreateDtoSchema>;

/** Outcome of provisioning an owner along with the organization. */
export const ProvisioningDtoSchema = z.object({
  owner: z.object({
    id: z.string(),
    email: z.string(),
    /** `true` when the user was created by this call, `false` when it already existed. */
    created: z.boolean(),
  }),
  /** `true` only when every mail of the owner's case was sent. */
  emailSent: z.boolean(),
});

export type ProvisioningDto = z.infer<typeof ProvisioningDtoSchema>;

/** Response of `POST /organizations`; `provisioning` is present only when an `owner` was sent. */
export const OrganizationCreateResponseDtoSchema = OrganizationDtoSchema.extend({
  provisioning: ProvisioningDtoSchema.optional(),
});

export type OrganizationCreateResponseDto = z.infer<typeof OrganizationCreateResponseDtoSchema>;
