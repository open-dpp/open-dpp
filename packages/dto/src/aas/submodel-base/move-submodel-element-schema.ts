import { z } from "zod";

export const MoveSubmodelElementSchema = z.object({
  // Omitted: keep the element's current parent (pure reorder). `null`: move
  // to the Submodel root explicitly. A string: move under that container.
  targetParentIdShortPath: z.string().nullable().optional(),
  position: z.number().optional(),
});

export type MoveSubmodelElementDto = z.infer<typeof MoveSubmodelElementSchema>;
