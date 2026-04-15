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
import { File } from "./file";

import { Property } from "./property";

describe("file", () => {
  it("should add submodel element", () => {
    const file = File.create({ idShort: "b1", contentType: "image/jpg" });
    expect(() =>
      file.addSubmodelElement(Property.fromPlain(propertyInputPlainFactory.build())),
    ).toThrow(new ValueError("File cannot contain submodel elements"));
  });

  it("should get submodel elements", () => {
    const file = File.create({ idShort: "b1", contentType: "image/jpg" });
    expect(file.getSubmodelElements()).toEqual([]);
  });

  it("should return plain value", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const file = File.create({
      idShort: "prop1",
      contentType: "image/jpg",
    });
    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    let ability = security.defineAbilityForSubject(member);
    expect(file.toPlain({ ability })).toMatchObject({
      idShort: "prop1",
      contentType: "image/jpg",
    });
    ability = security.defineAbilityForSubject(anonymous);
    expect(file.toPlain({ ability })).toEqual({});
  });
});
