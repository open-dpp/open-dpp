import { KeyTypesEnum } from "@open-dpp/aas";
import { z } from "zod";

export const KeyDbSchema = z.object({
  type: KeyTypesEnum,
  value: z.string(),
});
