import { MemberRoleDtoEnum } from "../users/user.dto";
import { z } from "zod";

export const MemberUserDtoSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable(),
  image: z.string().nullable(),
});

export type MemberUserDto = z.infer<typeof MemberUserDtoSchema>;

export interface MemberDto {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  user?: MemberUserDto;
}

export const MemberRoleChangeDtoSchema = z.object({ role: MemberRoleDtoEnum });
export type MemberRoleChangeDto = z.infer<typeof MemberRoleChangeDtoSchema>;
