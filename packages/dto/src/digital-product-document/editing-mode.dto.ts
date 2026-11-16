import { z } from "zod";

/**
 * What a digital product document currently allows to be edited.
 * - Full: structure and data
 * - DataOnly: data values (and rows) only
 * - ReadOnly: nothing; derived for locked templates, never stored on a passport
 */
export const EditingModeDto = {
  Full: "Full",
  DataOnly: "DataOnly",
  ReadOnly: "ReadOnly",
} as const;

export const EditingModeDtoEnum = z.enum(EditingModeDto);
export type EditingModeDtoType = z.infer<typeof EditingModeDtoEnum>;

/** The modes a passport can be stored in; `ReadOnly` does not apply to passports. */
export const PassportEditingModeDtoEnum = EditingModeDtoEnum.exclude([EditingModeDto.ReadOnly]);
export const PassportEditingModeDto = PassportEditingModeDtoEnum.enum;
export type PassportEditingModeDtoType = z.infer<typeof PassportEditingModeDtoEnum>;
