import { expect } from "@jest/globals";
import { DataTypeDef, PermissionKind, Permissions } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { propertyInputPlainFactory } from "@open-dpp/testing";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { Permission } from "../security/permission";
import { Security } from "../security/security";
import { SubjectAttributes } from "../security/subject-attributes";
import { Property } from "./property";
import { Range } from "./range";
import { IdShortPath } from "./submodel-base";

describe("range", () => {
  it("should add submodel element", () => {
    const range = Range.create({ idShort: "b1", valueType: DataTypeDef.String });
    expect(() => range.addSubmodelElement(Property.fromPlain(propertyInputPlainFactory.build()))).toThrow(
      new ValueError("Range cannot contain submodel elements"),
    );
  });

  it("should get submodel elements", () => {
    const range = Range.create({ idShort: "b1", valueType: DataTypeDef.String });
    expect(range.getSubmodelElements()).toEqual([]);
  });

  it("should return plain value", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const range = Range.create({
      idShort: "prop1",
      valueType: DataTypeDef.String,
    });

    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);
    expect(range.toPlain({ ability })).toMatchObject({
      idShort: "prop1",
      valueType: DataTypeDef.String,
    });
    ability = security.defineAbilityForSubject(anonymous);
    expect(range.toPlain({ ability })).toEqual({});
  });
});
