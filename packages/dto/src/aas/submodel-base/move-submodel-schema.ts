import { z } from "zod";

export const MoveSubmodelSchema = z.object({
  position: z.number(),
});

export type MoveSubmodelDto = z.infer<typeof MoveSubmodelSchema>;
