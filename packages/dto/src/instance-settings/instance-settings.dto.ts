import { z } from "zod";

export const BooleanSettingsResponseDtoSchema = z.object({
  value: z.boolean(),
  locked: z.boolean().optional(),
});

export type BooleanSettingsResponseDto = z.infer<typeof BooleanSettingsResponseDtoSchema>;

export const InstanceSettingsDtoSchema = z.object({
  id: z.string(),
  signupEnabled: BooleanSettingsResponseDtoSchema,
  organizationCreationEnabled: BooleanSettingsResponseDtoSchema,
});

export type InstanceSettingsDto = z.infer<typeof InstanceSettingsDtoSchema>;

export const InstanceSettingsUpdateDtoSchema = z.object({
  signupEnabled: z.boolean().optional(),
  organizationCreationEnabled: z.boolean().optional(),
});

export type InstanceSettingsUpdateDto = z.infer<typeof InstanceSettingsUpdateDtoSchema>;

export const PublicInstanceSettingsDtoSchema = z.object({
  signupEnabled: z.boolean(),
  organizationCreationEnabled: z.boolean().optional(),
});

export type PublicInstanceSettingsDto = z.infer<typeof PublicInstanceSettingsDtoSchema>;
