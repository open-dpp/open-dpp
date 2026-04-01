import { expect } from "@jest/globals";
import { AasSubmodelElements, PermissionKind, Permissions } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { propertyInputPlainFactory } from "@open-dpp/testing";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { Permission } from "../security/permission";
import { Security } from "../security/security";
import { SubjectAttributes } from "../security/subject-attributes";
import { Property } from "./property";
import { registerSubmodelElementClasses } from "./register-submodel-element-classes";
import { IdShortPath } from "./submodel-base";
import { SubmodelElementCollection } from "./submodel-element-collection";
import { SubmodelElementList } from "./submodel-element-list";

describe("submodelElementList", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });
  it("should add submodel element", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.Property,
      idShort: "idShort",
    });
    const submodelElement = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "submodelElement1" }));
    submodelElementList.addSubmodelElement(submodelElement);
    expect(submodelElementList.getSubmodelElements()).toEqual([submodelElement]);

    const submodelElement0 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "submodelElement0" }));
    submodelElementList.addSubmodelElement(submodelElement0, { position: 0 });
    expect(submodelElementList.getSubmodelElements()).toEqual([submodelElement0, submodelElement]);

    expect(() => submodelElementList.addSubmodelElement(submodelElement)).toThrow(
      new Error(`Submodel element with idShort ${submodelElement.idShort} already exists`),
    );
    expect(() => submodelElementList.addSubmodelElement(SubmodelElementCollection.create({ idShort: "sec1" }))).toThrow(
      new Error(`Submodel element type SubmodelElementCollection does not match list type Property`),
    );
  });

  it("should delete submodel element", () => {
    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.Property,
      idShort: "idShort",
    });
    const submodelElement0 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "submodelElement0" }));
    submodelElementList.addSubmodelElement(submodelElement0);
    const submodelElement1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "submodelElement1" }));
    submodelElementList.addSubmodelElement(submodelElement1);
    expect(submodelElementList.getSubmodelElements()).toEqual([submodelElement0, submodelElement1]);
    submodelElementList.deleteSubmodelElement(submodelElement0.idShort);
    expect(submodelElementList.getSubmodelElements()).toEqual([submodelElement1]);

    expect(() => submodelElementList.deleteSubmodelElement("unknown")).toThrow(ValueError);
  });

  it("should get values readable by specified subject", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    const submodelElementList = SubmodelElementList.create({
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
      idShort: "list",
    });

    const row = SubmodelElementCollection.create({ idShort: "row" });

    const prop1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "prop1" }));
    const prop2 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "prop2" }));
    row.addSubmodelElement(prop1);
    row.addSubmodelElement(prop2);

    submodelElementList.addSubmodelElement(row);

    security.addPolicy(member, IdShortPath.create({ path: "list" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(member, IdShortPath.create({ path: "list.row.prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(member, IdShortPath.create({ path: "list.row.prop2" }), []);

    let ability = security.defineAbilityForSubject(member);
    expect(submodelElementList.toPlain({ ability })).toEqual({ ...submodelElementList.toPlain(), value: [{ ...row.toPlain(), value: [prop1.toPlain()] }] });
    ability = security.defineAbilityForSubject(anonymous);
    expect(submodelElementList.toPlain({ ability })).toEqual({ });
  });
});
