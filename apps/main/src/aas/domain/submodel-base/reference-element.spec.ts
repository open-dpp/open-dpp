import { expect } from "@jest/globals";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { propertyInputPlainFactory } from "@open-dpp/testing";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../common/id-short-path";
import { Permission } from "../security/permission";
import { Security } from "../security/security";
import { SubjectAttributes } from "../security/subject-attributes";
import { Property } from "./property";

import { ReferenceElement } from "./reference-element";

describe("referenceElement", () => {
  it("should add submodel element", () => {
    const referenceElement = ReferenceElement.create({ idShort: "b1" });
    expect(() =>
      referenceElement.addSubmodelElement(Property.fromPlain(propertyInputPlainFactory.build())),
    ).toThrow(new ValueError("ReferenceElement cannot contain submodel elements"));
  });

  it("should get submodel elements", () => {
    const referenceElement = ReferenceElement.create({ idShort: "b1" });
    expect(referenceElement.getSubmodelElements()).toEqual([]);
  });

  it("should return plain value", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const referenceElement = ReferenceElement.create({
      idShort: "prop1",
    });

    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    let ability = security.defineAbilityForSubject(member);
    expect(referenceElement.toPlain({ ability })).toMatchObject({
      idShort: "prop1",
    });
    ability = security.defineAbilityForSubject(anonymous);
    expect(referenceElement.toPlain({ ability })).toEqual({});
  });
});
