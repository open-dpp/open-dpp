import { z } from "zod";

export const UserRole = {
  ADMIN: "admin", // That is the super admin over all organizations
  USER: "user",
  ANONYMOUS: "anonymous",
} as const;

export const UserRoleEnum = z.enum(UserRole);
export type UserRoleType = z.infer<typeof UserRoleEnum>;
