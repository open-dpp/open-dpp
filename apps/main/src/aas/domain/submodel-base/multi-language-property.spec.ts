import { expect } from "@jest/globals";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { propertyInputPlainFactory } from "@open-dpp/testing";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { LanguageText } from "../common/language-text";
import { Permission } from "../security/permission";
import { Security } from "../security/security";
import { SubjectAttributes } from "../security/subject-attributes";
import { MultiLanguageProperty } from "./multi-language-property";
import { Property } from "./property";
import { IdShortPath } from "./submodel-base";

describe("multiLanguageProperty", () => {
  it("should add submodel element", () => {
    const multiLanguageProperty = MultiLanguageProperty.create({ idShort: "b1" });
    expect(() => multiLanguageProperty.addSubmodelElement(Property.fromPlain(propertyInputPlainFactory.build()))).toThrow(
      new ValueError("MultiLanguageProperty cannot contain submodel elements"),
    );
  });

  it("should return plain value", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const valueEn = LanguageText.create({ language: "en", text: "value" });
    const multiLanguageProperty = MultiLanguageProperty.create({ idShort: "prop1", value: [valueEn] });
    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);
    expect(multiLanguageProperty.toPlain({ ability })).toMatchObject({
      idShort: "prop1",
      value: [{ language: "en", text: "value" }],
    });
    ability = security.defineAbilityForSubject(anonymous);
    expect(multiLanguageProperty.toPlain({ ability })).toEqual({});
  });

  it("should get submodel elements", () => {
    const multiLanguageProperty = MultiLanguageProperty.create({ idShort: "b1" });
    expect(multiLanguageProperty.getSubmodelElements()).toEqual([]);
  });
});
