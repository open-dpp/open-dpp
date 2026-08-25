import { z } from "zod";
import { UserRoleDtoEnum } from "./user.dto";

export const SetUserRoleDtoSchema = z.object({
  role: UserRoleDtoEnum,
});

export type SetUserRoleDto = z.infer<typeof SetUserRoleDtoSchema>;
