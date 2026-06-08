import { MemberRoleDtoEnum, UserDto } from "../users/user.dto";
import { z } from "zod";

export interface MemberDto {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  user?: UserDto;
}

export const MemberRoleChangeDtoSchema = z.object({ role: MemberRoleDtoEnum });
export type MemberRoleChangeDto = z.infer<typeof MemberRoleChangeDtoSchema>;
