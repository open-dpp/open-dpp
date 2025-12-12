import { z } from "zod";
import { KeyTypesEnum } from "../../../domain/common/key-types-enum";

export const KeyDbSchema = z.object({
  type: KeyTypesEnum,
  value: z.string(),
});
