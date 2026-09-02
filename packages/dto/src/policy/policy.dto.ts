import { z } from "zod";

/**
 * The policy rules an organization is held to. `*_QUOTA` keys count usage
 * within a period and reset, `*_LIMIT` keys are evaluated against current
 * state and never reset.
 */
export const PolicyKeyList = {
  AI_TOKEN_QUOTA: "AI_TOKEN_QUOTA",
  MEDIA_STORAGE_LIMIT: "MEDIA_STORAGE_LIMIT",
  PASSPORT_CREATE_LIMIT: "PASSPORT_CREATE_LIMIT",
} as const;

export const PolicyKeyEnum = z.enum(PolicyKeyList);
export type PolicyKey = z.infer<typeof PolicyKeyEnum>;

export const PolicyUtilizationDtoSchema = z.object({
  limit: z
    .number()
    .meta({ description: "The cap for this policy. 0 means unlimited.", example: 50 }),
  used: z.number().meta({ description: "How much of the cap is currently used.", example: 12 }),
  reset: z.iso
    .datetime()
    .optional()
    .meta({ description: "When the counter resets. Absent for limits, which never reset." }),
});

export type PolicyUtilizationDto = z.infer<typeof PolicyUtilizationDtoSchema>;

export const PolicyUtilizationsDtoSchema = z.record(PolicyKeyEnum, PolicyUtilizationDtoSchema);

export type PolicyUtilizationDtoType = z.infer<typeof PolicyUtilizationsDtoSchema>;

export const PolicyLimitDtoSchema = z
  .number()
  .int()
  .min(0)
  .meta({ description: "The new cap for this policy key. 0 means unlimited.", example: 100 });

/**
 * New limits keyed by policy key. Omitted keys keep the limit they already
 * have, so a caller only sends what it wants to change.
 */
export const SetPolicyLimitsDtoSchema = z
  .partialRecord(PolicyKeyEnum, PolicyLimitDtoSchema)
  .refine((limits) => Object.keys(limits).length > 0, {
    message: "At least one policy key must be provided",
  })
  .meta({
    description:
      "New limits keyed by policy key. Keys that are omitted keep their current limit. At least one key is required.",
  });

export type SetPolicyLimitsDto = z.infer<typeof SetPolicyLimitsDtoSchema>;
