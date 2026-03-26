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
import { SubmodelElementCollection } from "./submodel-element-collection";

describe("submodelElementCollection", () => {
  it("should add submodel element", () => {
    const submodelElementCollection = SubmodelElementCollection.create({
      idShort: "idShort",
    });
    const submodelElement = Property.fromPlain(propertyInputPlainFactory.build());
    submodelElementCollection.addSubmodelElement(submodelElement);
    expect(submodelElementCollection.getSubmodelElements()).toEqual([submodelElement]);

    const submodelElement0 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "submodelElement0" }));
    submodelElementCollection.addSubmodelElement(submodelElement0, { position: 0 });
    expect(submodelElementCollection.getSubmodelElements()).toEqual([submodelElement0, submodelElement]);

    expect(() => submodelElementCollection.addSubmodelElement(submodelElement)).toThrow(
      new Error(`Submodel element with idShort ${submodelElement.idShort} already exists`),
    );
  });

  it("should get values readable by specified subject", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    const submodelElementCollection = SubmodelElementCollection.create({ idShort: "subSection1" });
    const prop1 = Property.create({ idShort: "prop1", value: "10", valueType: DataTypeDef.Double });
    const prop2 = Property.create({ idShort: "prop2", value: "10", valueType: DataTypeDef.Double });

    submodelElementCollection.addSubmodelElement(prop1);
    submodelElementCollection.addSubmodelElement(prop2);
    security.addPolicy(member, IdShortPath.create({ path: "subSection1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(member, IdShortPath.create({ path: "subSection1.prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(member, IdShortPath.create({ path: "subSection1.prop2" }), []);

    let ability = security.defineAbilityForSubject(member);
    expect(submodelElementCollection.toPlain({ ability })).toEqual({ ...submodelElementCollection.toPlain(), value: [prop1.toPlain()] });
    ability = security.defineAbilityForSubject(anonymous);
    expect(submodelElementCollection.toPlain({ ability })).toEqual({ });
  });

  it("should delete submodel element", () => {
    const submodelElementCollection = SubmodelElementCollection.create({
      idShort: "idShort",
    });
    const submodelElement1 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "submodelElement1" }));
    submodelElementCollection.addSubmodelElement(submodelElement1);
    const submodelElement2 = Property.fromPlain(propertyInputPlainFactory.build({ idShort: "submodelElement2" }));
    submodelElementCollection.addSubmodelElement(submodelElement2);

    expect(submodelElementCollection.getSubmodelElements()).toEqual([submodelElement1, submodelElement2]);
    submodelElementCollection.deleteSubmodelElement(submodelElement1.idShort);
    expect(submodelElementCollection.getSubmodelElements()).toEqual([submodelElement2]);

    expect(() => submodelElementCollection.deleteSubmodelElement("unknown idShort")).toThrow(
      ValueError,
    );
  });
});
