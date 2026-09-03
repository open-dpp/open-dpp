import { z } from "zod";
import { PositionSchema } from "../../shared/position";

export const MoveSubmodelSchema = z.object({
  position: PositionSchema,
});

export type MoveSubmodelDto = z.infer<typeof MoveSubmodelSchema>;
