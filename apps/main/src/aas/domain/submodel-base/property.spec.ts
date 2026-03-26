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
import { IdShortPath } from "./submodel-base";

describe("property", () => {
  it.each([
    { value: "blub1", valueType: DataTypeDef.Double, errorMessage: "Invalid input: expected number, received NaN" },
    { value: "blub1", valueType: DataTypeDef.Float, errorMessage: "Invalid input: expected number, received NaN" },
  ])("should validate value attribute for $valueType", ({ value, valueType, errorMessage }) => {
    expect(() => Property.create({ idShort: "b1", value, valueType })).toThrow(
      new ValueError(`Invalid value for valueType ${valueType}: ${errorMessage}`),
    );
  });

  it("should add submodel element", () => {
    const property = Property.create({ idShort: "b1", valueType: DataTypeDef.String });
    expect(() => property.addSubmodelElement(Property.fromPlain(propertyInputPlainFactory.build()))).toThrow(
      new ValueError("Property cannot contain submodel elements"),
    );
  });

  it("should get submodel elements", () => {
    const property = Property.create({ idShort: "b1", valueType: DataTypeDef.String });
    expect(property.getSubmodelElements()).toEqual([]);
  });

  it("should return plain value", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const property = Property.create({
      idShort: "prop1",
      valueType: DataTypeDef.String,
    });
    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);
    expect(property.toPlain({ ability })).toMatchObject({
      idShort: "prop1",
      valueType: DataTypeDef.String,
    });
    ability = security.defineAbilityForSubject(anonymous);
    expect(property.toPlain({ ability })).toEqual({});
  });
});
