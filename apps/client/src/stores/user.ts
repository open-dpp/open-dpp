import type { MemberRoleDtoType, UserRoleDtoType } from "@open-dpp/dto";
import type { Ref } from "vue";
import type { Subject } from "../lib/aas-security.ts";
import {
  MemberRoleDtoEnum,

  UserRoleDto,
  UserRoleDtoEnum,

} from "@open-dpp/dto";
import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "./http-codes.ts";

interface BetterAuthSession {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
  firstName: string;
  lastName: string;
  banned: boolean | null | undefined;
  role?: string | null | undefined;
  banReason?: string | null | undefined;
  banExpires?: Date | null | undefined;
}

export interface IUserStore {
  user: Ref<{ role: UserRoleDtoType; id: string | null }>;
  memberRole: Ref<MemberRoleDtoType | undefined>;
  updateUserBySession: (session: { user: BetterAuthSession } | null) => void;
  fetchMemberRole: (organizationId: string) => Promise<void>;
  asSubject: () => Subject;
}

export const useUserStore = defineStore("user", (): IUserStore => {
  const user = ref<{ role: UserRoleDtoType; id: string | null }>({ role: UserRoleDto.ANONYMOUS, id: null });
  const memberRole = ref<MemberRoleDtoType | undefined>(undefined);

  function updateUserBySession(
    session: { user: BetterAuthSession } | null,
  ) {
    if (session) {
      user.value.role = session.user.role ? UserRoleDtoEnum.parse(session.user.role) : UserRoleDto.ANONYMOUS;
      user.value.id = session.user.id;
    }
    else {
      user.value.role = UserRoleDto.ANONYMOUS;
      user.value.id = null;
    }
  }

  async function fetchMemberRole(organizationId: string) {
    try {
      const response = await apiClient.dpp.organizations.getMembers(organizationId);
      if (response.status === HTTPCode.OK) {
        const foundMember = response.data.find(
          member => member.userId === user.value.id,
        );
        memberRole.value = MemberRoleDtoEnum.optional().parse(foundMember?.role);
      }
      else {
        memberRole.value = undefined;
      }
    }
    catch (error) {
      console.error("Error fetching member role:", error);
      memberRole.value = undefined;
    }
  }

  function asSubject(ignoreMemberRoleForAdmin: boolean = true): Subject {
    return {
      userRole: user.value.role,
      ...(ignoreMemberRoleForAdmin && user.value.role === UserRoleDto.ADMIN ? {} : { memberRole: memberRole.value }),
    };
  }

  return { user, memberRole, updateUserBySession, fetchMemberRole, asSubject };
});
