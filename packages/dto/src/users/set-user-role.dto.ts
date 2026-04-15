import { z } from "zod";

export const SetUserRoleDtoSchema = z.object({
  role: z.enum(["admin", "user"]),
});

export type SetUserRoleDto = z.infer<typeof SetUserRoleDtoSchema>;
