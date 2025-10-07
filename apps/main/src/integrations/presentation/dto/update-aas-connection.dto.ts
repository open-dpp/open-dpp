import { z } from "zod";
import { AasFieldAssignmentSchema } from "./aas-connection.dto";

export const UpdateAasConnectionSchema = z.object({
  name: z.string(),
  modelId: z.uuid().nullable(),
  fieldAssignments: AasFieldAssignmentSchema.array(),
});

export type UpdateAasConnectionDto = z.infer<typeof UpdateAasConnectionSchema>;
