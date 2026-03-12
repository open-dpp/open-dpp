import { it } from "@jest/globals";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../submodel-base/submodel-base";
import { createAasObject } from "./aas-object";
import { AasResource } from "./casl-ability";
import { Permission } from "./permission";
import { Security } from "./security";
import { SubjectAttributes } from "./subject-attributes";

describe("security", () => {
  it("create security schema and checks permissions", () => {
    const security = Security.create({});
    security.addPolicy(SubjectAttributes.create({ role: UserRole.USER }), createAasObject(IdShortPath.create({ path: "section1" })), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(SubjectAttributes.create({ role: UserRole.USER }), createAasObject(IdShortPath.create({ path: "section1.field1" })), [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(SubjectAttributes.create({ role: UserRole.USER }));
    expect(ability.can(
      { action: Permissions.Read, object: AasResource.create({ idShortPath: IdShortPath.create({ path: "section1" }) }) },
    )).toBeTruthy();
    expect(ability.can(
      { action: Permissions.Edit, object: AasResource.create({ idShortPath: IdShortPath.create({ path: "section1.field1" }) }) },
    )).toBeTruthy();
    // the specific rule of the field1 should override general rule of section1
    expect(ability.can(
      { action: Permissions.Read, object: AasResource.create({ idShortPath: IdShortPath.create({ path: "section1.field1" }) }) },
    )).toBeFalsy();
    // sub elements of section1 should inherit the rule of section1 if not overridden
    expect(ability.can(
      { action: Permissions.Read, object: AasResource.create({ idShortPath: IdShortPath.create({ path: "section1.field2" }) }) },
    )).toBeTruthy();
    expect(ability.can(
      { action: Permissions.Read, object: AasResource.create({ idShortPath: IdShortPath.create({ path: "section1.subsection1.field1" }) }) },
    )).toBeTruthy();

    ability = security.defineAbilityForSubject(SubjectAttributes.create({ role: UserRole.ADMIN }));
    expect(ability.can(
      { action: Permissions.Read, object: AasResource.create({ idShortPath: IdShortPath.create({ path: "section1" }) }) },
    )).toBeFalsy();
  });

  it("create security schema and checks permissions within organization context", () => {
    const security = Security.create({});
    const organizationId = "org1";
    security.addPolicy(SubjectAttributes.create({
      role: MemberRole.MEMBER,
      organizationId,
    }), createAasObject(IdShortPath.create({ path: "section1" })), [Permission.create({
      permission: Permissions.Read,
      kindOfPermission: PermissionKind.Allow,
    })]);
    security.addPolicy(SubjectAttributes.create({
      role: MemberRole.MEMBER,
      organizationId,
    }), createAasObject(IdShortPath.create({ path: "section1.field1" })), [Permission.create({
      permission: Permissions.Edit,
      kindOfPermission: PermissionKind.Allow,
    })]);
    let ability = security.defineAbilityForSubject(SubjectAttributes.create({
      role: MemberRole.MEMBER,
      organizationId,
    }));
    expect(ability.can(
      { action: Permissions.Read, object: AasResource.create({ idShortPath: IdShortPath.create({ path: "section1" }), organizationId }) },
    )).toBeTruthy();
    // the specific rule of the field1 should override general rule of section1
    expect(ability.can({
      action: Permissions.Read,
      object: AasResource.create({ idShortPath: IdShortPath.create({ path: "section1.field1" }), organizationId }),
    })).toBeFalsy();
    // access to section1 should be denied for other organization members
    const otherOrganizationId = "org2";
    ability = security.defineAbilityForSubject(SubjectAttributes.create({
      role: MemberRole.MEMBER,
      organizationId: otherOrganizationId,
    }));
    expect(ability.can(
      { action: Permissions.Read, object: AasResource.create({ idShortPath: IdShortPath.create({ path: "section1" }), organizationId: otherOrganizationId }) },
    )).toBeFalsy();
    // access to section1 should be denied for users which have not member role
    ability = security.defineAbilityForSubject(SubjectAttributes.create({
      role: UserRole.USER,
    }));
    expect(ability.can(
      { action: Permissions.Read, object: AasResource.create({ idShortPath: IdShortPath.create({ path: "section1" }) }) },
    )).toBeFalsy();
  });

  it("should add policy fails if it already exists", () => {
    const security = Security.create({});
    security.addPolicy(SubjectAttributes.create({ role: UserRole.USER }), createAasObject(IdShortPath.create({ path: "section1" })), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    expect(() => security.addPolicy(SubjectAttributes.create({ role: UserRole.USER }), createAasObject(IdShortPath.create({ path: "section1" })), [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })])).toThrow(
      new ValueError(`Permission for subject { role: user } and object section1 already exists`),
    );
  });

  // it("should modify rule", () => {
  //   const security = Security.create({});
  //   const rule = AccessPermissionRule.create({ targetSubjectAttributes: SubjectAttributes.create({ role: UserRole.USER }), permissionsPerObject: [
  //     PermissionPerObject.create({
  //       object: IdShortPath.create({ path: "section1" }),
  //       permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
  //     }),
  //     PermissionPerObject.create({
  //       object: IdShortPath.create({ path: "section1.field1" }),
  //       permissions: [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })],
  //     }),
  //   ] });
  //
  //   security.addRule(rule);
  //
  //   security.modifyRule({ targetSubjectAttributes: { role: UserRole.USER }, permissionsPerObject: [
  //     {
  //       object: "section1",
  //       permissions: [{ permission: Permissions.Read, kindOfPermission: PermissionKind.Deny }],
  //     },
  //     {
  //       object: "section2.field3",
  //       permissions: [{ permission: Permissions.Create, kindOfPermission: PermissionKind.Deny }],
  //     },
  //   ] });
  // });
});
