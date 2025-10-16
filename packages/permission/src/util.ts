import type { PermissionAction_TYPE } from "./PermissionAction";
import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  MongoAbility,
} from "@casl/ability";
import { PermissionAction } from "./PermissionAction";
import { OrganizationSubject } from "./subjects/OrganizationSubject";

interface AuthContext {
  user: {
    id: string;
  };
}

type Subjects = OrganizationSubject | typeof OrganizationSubject;
type AppAbility = MongoAbility<[PermissionAction_TYPE, Subjects]>;

export function defineAbilitiesForAuthContext(authContext: AuthContext) {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
  // all users can create organizations
  can(PermissionAction.CREATE, OrganizationSubject);
  // can read organization if member
  can(PermissionAction.READ, OrganizationSubject, {
    members: { $in: [authContext.user.id] },
  });
  can(PermissionAction.READ, OrganizationSubject, {
    ownedByUserId: authContext.user.id,
  });
  // can update organization if an owner
  can(PermissionAction.UPDATE, OrganizationSubject, {
    ownedByUserId: authContext.user.id,
  });
  // can delete organization if owner
  can(PermissionAction.DELETE, OrganizationSubject, {
    ownedByUserId: authContext.user.id,
  });
  return build({
    detectSubjectType: (object) => {
      return object.constructor as ExtractSubjectType<Subjects>;
    },
  });
}

export function hasPermission(
  authContext: AuthContext,
  action: PermissionAction_TYPE,
  subjectData: Subjects,
) {
  const ability = defineAbilitiesForAuthContext(authContext);
  return ability.can(action, subjectData);
}
