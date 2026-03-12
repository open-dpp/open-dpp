import { z } from "zod";

export const MemberRole = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export const MemberRoleEnum = z.enum(MemberRole);
export type MemberRoleType = z.infer<typeof MemberRoleEnum>;
