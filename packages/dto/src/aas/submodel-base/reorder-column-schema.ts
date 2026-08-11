import { z } from "zod";

export const ReorderColumnSchema = z.object({
  position: z.number(),
});

export type ReorderColumnDto = z.infer<typeof ReorderColumnSchema>;
