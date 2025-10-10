import {AbilityBuilder, createMongoAbility, defineAbility} from "@casl/ability";
import { PermissionAction } from "./PermissionAction";
import { PermissionTarget } from "./PermissionTarget";

interface AuthContext {
  user: {
    id: string;
  }
}

interface Organization {
  id: string;
  ownerUserId: string;
  members: string[];
}

export function defineAbilitiesForOrganization = (authContext: AuthContext, organization: Organization) =>
    defineAbility((can) => {
  // all users can create organizations
  can(PermissionAction.CREATE, PermissionTarget.ORGANIZATION);
  // can read organization if member
  can(PermissionAction.READ, PermissionTarget.ORGANIZATION, {
    organizationMembers: { $in: [authContext.user.id] },
  });
  // can update organization if an owner
  can(PermissionAction.UPDATE, PermissionTarget.ORGANIZATION, {
    ownerUserId: authContext.user.id,
  });
  // can delete organization if owner
  can(PermissionAction.DELETE, PermissionTarget.ORGANIZATION, {
    ownerUserId: authContext.user.id,
  });
});
