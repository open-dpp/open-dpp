import { LanguageEnum } from "../aas/enums/language-enum";
import { z } from "zod";

export const UserDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  emailVerified: z.boolean(),
  preferredLanguage: LanguageEnum,
  pendingEmail: z.string().nullable(),
  pendingEmailRequestedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;

export const UserRoleDto = {
  ADMIN: "admin", // That is the super admin over all organizations
  USER: "user",
  ANONYMOUS: "anonymous",
} as const;

export const UserRoleDtoEnum = z.enum(UserRoleDto);
export type UserRoleDtoType = z.infer<typeof UserRoleDtoEnum>;

export const MemberRoleDto = {
  OWNER: "owner",
  MEMBER: "member",
} as const;

export const MemberRoleDtoEnum = z.enum(MemberRoleDto);
export type MemberRoleDtoType = z.infer<typeof MemberRoleDtoEnum>;
