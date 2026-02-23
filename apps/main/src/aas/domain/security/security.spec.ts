import { it } from "@jest/globals";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../submodel-base/submodel-base";
import { AccessPermissionRule } from "./access-permission-rule";
import { Permission } from "./permission";
import { PermissionPerObject } from "./permission-per-object";
import { Security } from "./security";

describe("security", () => {
  it("checks", () => {
    const security = Security.create({});
    const rule = AccessPermissionRule.create({ targetSubjectAttributes: { role: UserRole.USER }, permissionsPerObject: [
      PermissionPerObject.create({
        object: IdShortPath.create({ path: "section1" }),
        permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
      }),
    ] });
    security.addRule(rule);
    let ability = security.defineAbilityForSubject({ role: UserRole.USER });
    expect(ability.can("Read", "section1")).toBeTruthy();
    ability = security.defineAbilityForSubject({ role: UserRole.ADMIN });
    expect(ability.can("Read", "section1")).toBeFalsy();
  });
});
