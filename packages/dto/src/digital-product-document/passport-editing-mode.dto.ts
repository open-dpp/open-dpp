import { z } from "zod";

export const PassportEditingModeDto = {
  Full: "Full",
  DataOnly: "DataOnly",
} as const;

export const PassportEditingModeDtoEnum = z.enum(PassportEditingModeDto);
export type PassportEditingModeDtoType = z.infer<typeof PassportEditingModeDtoEnum>;
