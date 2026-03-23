import { MemberRoleDto, UserRoleDto } from "@open-dpp/dto";

export function useAasRoleHierarchy() {
  const roleHierarchy = [
    { name: "Admin", key: { userRole: UserRoleDto.ADMIN } }, // instance admin, the organization role is not relevant
    {
      name: "Owner",
      key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.OWNER },
    }, // organization owner
    {
      name: "Member",
      key: { userRole: UserRoleDto.USER, memberRole: MemberRoleDto.MEMBER },
    }, // organization member
    { name: "Öffentlich", key: { userRole: UserRoleDto.ANONYMOUS } }, // anonymous user without an account
  ];
  return { hierarchy: roleHierarchy };
}
