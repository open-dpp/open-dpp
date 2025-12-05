import { z } from "zod";

import { KeyTypesEnum } from "../../common/key-types-enum";

export const KeyJsonSchema = z.object({
  type: KeyTypesEnum,
  value: z.string(),
});
