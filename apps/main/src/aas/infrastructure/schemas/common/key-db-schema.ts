import { KeyTypesEnum } from "@open-dpp/dto";
import { z } from "zod";

export const KeyDbSchema = z.object({
  type: KeyTypesEnum,
  value: z.string(),
});
