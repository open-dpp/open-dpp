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
  effectiveFallback: z.string(),
});

export type InstanceSettingsDto = z.infer<typeof InstanceSettingsDtoSchema>;

export const InstanceSettingsUpdateDtoSchema = z.object({
  signupEnabled: z.boolean().optional(),
  organizationCreationEnabled: z.boolean().optional(),
  permalinkBaseUrl: PermalinkBaseUrlSchema.nullable().optional(),
});

export type InstanceSettingsUpdateDto = z.infer<typeof InstanceSettingsUpdateDtoSchema>;

export const PublicInstanceSettingsDtoSchema = z.object({
  signupEnabled: z.boolean(),
  organizationCreationEnabled: z.boolean().optional(),
});

export type PublicInstanceSettingsDto = z.infer<typeof PublicInstanceSettingsDtoSchema>;
