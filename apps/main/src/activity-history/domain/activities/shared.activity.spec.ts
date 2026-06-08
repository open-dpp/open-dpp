import { Security } from "../../../aas/domain/security/security";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { Permission } from "../../../aas/domain/security/permission";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { filterChangesByAbility } from "./shared.activity";
import { DisplayNameChanged } from "../change-events/language-text-collection-changed";
import { PolicyAdded } from "../change-events/policy-added";
import { createAasObject } from "../../../aas/domain/security/aas-object";

describe("SharedActivity", () => {
  it("should filter changes by ability", () => {
    const security = Security.create({});
    const owner = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.OWNER,
    });
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    security.addPolicy(owner, IdShortPath.create({ path: "section1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(owner);
    const change1 = DisplayNameChanged.create({
      path: IdShortPath.create({ path: "section1" }),
      oldValue: [],
      newValue: [],
    });
    const change2 = DisplayNameChanged.create({
      path: IdShortPath.create({ path: "section2" }),
      oldValue: [],
      newValue: [],
    });
    const change3 = PolicyAdded.create({
      userRole: member.userRole,
      memberRole: member.memberRole,
      object: createAasObject(IdShortPath.create({ path: "section1" })),
      value: [
        Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      ],
    });

    const change4 = PolicyAdded.create({
      userRole: UserRole.ADMIN,
      object: createAasObject(IdShortPath.create({ path: "section1" })),
      value: [
        Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      ],
    });
    const changes = [change1, change2, change3, change4];
    let filteredChanges = filterChangesByAbility(changes, { ability });
    expect(filteredChanges).toEqual([change1, change3]);

    const memberAbility = security.defineAbilityForSubject(member);

    filteredChanges = filterChangesByAbility(changes, { ability: memberAbility });
    expect(filteredChanges).toEqual([]);
  });
});
