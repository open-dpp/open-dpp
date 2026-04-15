import { expect, jest } from "@jest/globals";
import { DataTypeDef, PermissionKind, Permissions } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { propertyInputPlainFactory } from "@open-dpp/testing";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../common/id-short-path";
import { Permission } from "../security/permission";
import { Security } from "../security/security";
import { SubjectAttributes } from "../security/subject-attributes";
import { Property } from "./property";
import { SubmodelElementCollection } from "./submodel-element-collection";

describe("submodelElementCollection", () => {
  const member = SubjectAttributes.create({
    userRole: UserRole.USER,
    memberRole: MemberRole.MEMBER,
  });

  it("should add submodel element", () => {
    const submodelElementCollection = SubmodelElementCollection.create({
      idShort: "idShort",
    });
    const security = Security.create({});
    security.addPolicy(member, IdShortPath.create({ path: submodelElementCollection.idShort }), [
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);

    const ability = security.defineAbilityForSubject(member);

    const submodelElement = Property.fromPlain(propertyInputPlainFactory.build());
    submodelElementCollection.addSubmodelElement(submodelElement, { ability });
    expect(submodelElementCollection.getSubmodelElements()).toEqual([submodelElement]);

    const submodelElement0 = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "submodelElement0" }),
    );
    submodelElementCollection.addSubmodelElement(submodelElement0, { position: 0, ability });
    expect(submodelElementCollection.getSubmodelElements()).toEqual([
      submodelElement0,
      submodelElement,
    ]);

    expect(() =>
      submodelElementCollection.addSubmodelElement(submodelElement, { ability }),
    ).toThrow(new Error(`Submodel element with idShort ${submodelElement.idShort} already exists`));
  });

  it("should get values readable by specified subject", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    const submodelElementCollection = SubmodelElementCollection.create({ idShort: "subSection1" });

    security.addPolicy(member, IdShortPath.create({ path: "subSection1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    security.addPolicy(member, IdShortPath.create({ path: "subSection1.prop1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    security.addPolicy(member, IdShortPath.create({ path: "subSection1.prop2" }), []);

    let ability = security.defineAbilityForSubject(member);

    const prop1 = Property.create({ idShort: "prop1", value: "10", valueType: DataTypeDef.Double });
    const prop2 = Property.create({ idShort: "prop2", value: "10", valueType: DataTypeDef.Double });

    submodelElementCollection.addSubmodelElement(prop1, { ability });
    submodelElementCollection.addSubmodelElement(prop2, { ability });

    expect(submodelElementCollection.toPlain({ ability })).toEqual({
      ...submodelElementCollection.toPlain(),
      value: [prop1.toPlain()],
    });
    ability = security.defineAbilityForSubject(anonymous);
    expect(submodelElementCollection.toPlain({ ability })).toEqual({});
    security.addPolicy(anonymous, IdShortPath.create({ path: "subSection1.prop2" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    ability = security.defineAbilityForSubject(anonymous);
    expect(submodelElementCollection.toPlain({ ability })).toEqual({
      ...submodelElementCollection.toPlain(),
      value: [prop2.toPlain()],
    });
  });

  it("should delete submodel element", () => {
    const submodelElementCollection = SubmodelElementCollection.create({
      idShort: "idShort",
    });
    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    security.addPolicy(member, IdShortPath.create({ path: "idShort" }), [
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Delete, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);
    const submodelElement1 = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "submodelElement1" }),
    );
    submodelElementCollection.addSubmodelElement(submodelElement1, { ability });
    const submodelElement2 = Property.fromPlain(
      propertyInputPlainFactory.build({ idShort: "submodelElement2" }),
    );
    submodelElementCollection.addSubmodelElement(submodelElement2, { ability });

    expect(submodelElementCollection.getSubmodelElements()).toEqual([
      submodelElement1,
      submodelElement2,
    ]);
    const onDelete = jest.fn();
    submodelElementCollection.deleteSubmodelElement(submodelElement1.idShort, {
      ability,
      onDelete,
    });
    expect(onDelete).toHaveBeenCalledWith(submodelElement1);
    expect(submodelElementCollection.getSubmodelElements()).toEqual([submodelElement2]);

    expect(() =>
      submodelElementCollection.deleteSubmodelElement("unknown idShort", { ability, onDelete }),
    ).toThrow(ValueError);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
