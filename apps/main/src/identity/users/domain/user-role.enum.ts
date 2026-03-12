import { z } from "zod";

export const UserRole = {
  ADMIN: "admin",
  USER: "user",
} as const;

export const UserRoleEnum = z.enum(UserRole);
export type UserRoleType = z.infer<typeof UserRoleEnum>;
