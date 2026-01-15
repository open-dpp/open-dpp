import { z } from "zod";

export const AasEditMode = {
  Passport: "passport",
  Template: "template",
} as const;

export const AasEditModeEnum = z.enum(AasEditMode);
export type AasEditModeType = z.infer<typeof AasEditModeEnum>;
