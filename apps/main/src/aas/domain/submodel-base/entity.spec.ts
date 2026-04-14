import { expect } from "@jest/globals";
import { EntityType, PermissionKind, Permissions } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { propertyInputPlainFactory } from "@open-dpp/testing";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../common/id-short-path";
import { Permission } from "../security/permission";
import { Security } from "../security/security";
import { SubjectAttributes } from "../security/subject-attributes";
import { Entity } from "./entity";

import { Property } from "./property";

describe("entity", () => {
  it("should add submodel element", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    security.addPolicy(member, IdShortPath.create({ path: "idShort" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);
    const ability = security.defineAbilityForSubject(member);
    const entity = Entity.create({
      idShort: "idShort",
      entityType: EntityType.CoManagedEntity,
    });
    const submodelElement = Property.fromPlain(propertyInputPlainFactory.build());
    entity.addSubmodelElement(submodelElement, { ability });
    expect(entity.getSubmodelElements()).toEqual([submodelElement]);
    expect(() => entity.addSubmodelElement(submodelElement, { ability })).toThrow(
      new ValueError(`Submodel element with idShort ${submodelElement.idShort} already exists`),
    );
  });

  it("should return plain value", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const entity = Entity.create({
      idShort: "prop1",
      entityType: EntityType.CoManagedEntity,
    });
    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);
    let ability = security.defineAbilityForSubject(member);
    expect(entity.toPlain({ ability })).toMatchObject({
      idShort: "prop1",
      entityType: EntityType.CoManagedEntity,
    });
    ability = security.defineAbilityForSubject(anonymous);
    expect(entity.toPlain({ ability })).toEqual({});
  });
});
