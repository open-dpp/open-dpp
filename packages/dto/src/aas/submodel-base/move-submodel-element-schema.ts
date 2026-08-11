import { z } from "zod";

export const MoveSubmodelElementSchema = z.object({
  targetParentIdShortPath: z.string().optional(),
  position: z.number().optional(),
});

export type MoveSubmodelElementDto = z.infer<typeof MoveSubmodelElementSchema>;
