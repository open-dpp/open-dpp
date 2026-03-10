import { it } from "@jest/globals";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { Submodel } from "../submodel-base/submodel";
import { IdShortPath } from "../submodel-base/submodel-base";
import { SubmodelElementCollection } from "../submodel-base/submodel-element-collection";
import { AccessPermissionRule } from "./access-permission-rule";
import { Permission } from "./permission";
import { PermissionPerObject } from "./permission-per-object";
import { Security } from "./security";

describe("security", () => {
  it("checks", () => {
    // sustainability: user can read
    // sustainability.section1.field1: user can write
    // sustainability.section2.field1: deny read

    const security = Security.create({});
    const rule = AccessPermissionRule.create({ targetSubjectAttributes: { role: UserRole.USER }, permissionsPerObject: [
      PermissionPerObject.create({
        object: IdShortPath.create({ path: "section1" }),
        permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
      }),
      PermissionPerObject.create({
        object: IdShortPath.create({ path: "section1.field1" }),
        permissions: [Permission.create({ permission: Permissions.Write, kindOfPermission: PermissionKind.Allow })],
      }),
    ] });
    const submodel = Submodel.create({ id: "sub1", idShort: "section1" });
    const submodelElementCollection = SubmodelElementCollection.create({ idShort: "field1" });
    submodel.addSubmodelElement(submodelElementCollection);
    security.addRule(rule);
    let ability = security.defineAbilityForSubject({ role: UserRole.USER });
    expect(ability.can({ action: Permissions.Read, object: IdShortPath.create({ path: "section1" }) })).toBeTruthy();
    expect(ability.can({ action: Permissions.Write, object: IdShortPath.create({ path: "section1.field1" }) })).toBeTruthy();
    expect(ability.can({ action: Permissions.Read, object: IdShortPath.create({ path: "section1.field1" }) })).toBeFalsy();
    expect(ability.can({ action: Permissions.Read, object: IdShortPath.create({ path: "section1.field2" }) })).toBeTruthy();

    ability = security.defineAbilityForSubject({ role: UserRole.ADMIN });
    expect(ability.can({ action: Permissions.Read, object: IdShortPath.create({ path: "section1" }) })).toBeFalsy();
  });
});
