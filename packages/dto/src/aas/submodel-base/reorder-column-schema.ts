import { z } from "zod";
import { PositionSchema } from "../../shared/position";

export const ReorderColumnSchema = z.object({
  position: PositionSchema,
});

export type ReorderColumnDto = z.infer<typeof ReorderColumnSchema>;
