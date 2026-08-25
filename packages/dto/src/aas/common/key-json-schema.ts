import { z } from "zod";

import { KeyTypesEnum } from "../enums/key-types-enum";

export const KeyJsonSchema = z.object({
  type: KeyTypesEnum,
  value: z.string(),
});

export type KeyDto = z.infer<typeof KeyJsonSchema>;

export const KeyModificationSchema = KeyJsonSchema;
