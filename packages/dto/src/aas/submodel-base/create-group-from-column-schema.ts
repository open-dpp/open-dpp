import { z } from "zod";
import { SubmodelElementSchema } from "./submodel-element-schema";

export const CreateGroupFromColumnSchema = z.object({
  columnIdShort: z.string(),
  group: SubmodelElementSchema,
});

export type CreateGroupFromColumnDto = z.infer<typeof CreateGroupFromColumnSchema>;
