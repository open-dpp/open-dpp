import { z } from "zod";
import { PermalinkBaseUrlSchema } from "../shared/permalink-base-url.schema";

export const BooleanSettingsResponseDtoSchema = z.object({
  value: z.boolean(),
  locked: z.boolean().optional(),
});

export type BooleanSettingsResponseDto = z.infer<typeof BooleanSettingsResponseDtoSchema>;

export const StringSettingsResponseDtoSchema = z.object({
  value: z.string().nullable(),
  locked: z.boolean().optional(),
});

export type StringSettingsResponseDto = z.infer<typeof StringSettingsResponseDtoSchema>;

export const InstanceSettingsDtoSchema = z.object({
  id: z.string(),
  signupEnabled: BooleanSettingsResponseDtoSchema,
  organizationCreationEnabled: BooleanSettingsResponseDtoSchema,
  permalinkBaseUrl: StringSettingsResponseDtoSchema,
  mailEnabled: BooleanSettingsResponseDtoSchema,
  effectiveFallback: z.string(),
});

export type InstanceSettingsDto = z.infer<typeof InstanceSettingsDtoSchema>;

/** The admin DTO keys whose setting is a boolean toggle. */
export type BooleanInstanceSettingKey = {
  [K in keyof InstanceSettingsDto]: InstanceSettingsDto[K] extends BooleanSettingsResponseDto
    ? K
    : never;
}[keyof InstanceSettingsDto];

/** Every boolean setting of the admin DTO, in schema order; derived, so it never drifts. */
export const BOOLEAN_INSTANCE_SETTING_KEYS = Object.entries(InstanceSettingsDtoSchema.shape)
  .filter(([, schema]) => schema === BooleanSettingsResponseDtoSchema)
  .map(([key]) => key) as BooleanInstanceSettingKey[];

export const InstanceSettingsUpdateDtoSchema = z.object({
  signupEnabled: z.boolean().optional(),
  organizationCreationEnabled: z.boolean().optional(),
  permalinkBaseUrl: PermalinkBaseUrlSchema.nullable().optional(),
  mailEnabled: z.boolean().optional(),
});

export type InstanceSettingsUpdateDto = z.infer<typeof InstanceSettingsUpdateDtoSchema>;

export const PublicInstanceSettingsDtoSchema = z.object({
  signupEnabled: z.boolean(),
  organizationCreationEnabled: z.boolean().optional(),
  usageManagementUrl: z.string().optional(),
});

export type PublicInstanceSettingsDto = z.infer<typeof PublicInstanceSettingsDtoSchema>;
