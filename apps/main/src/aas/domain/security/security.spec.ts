import { it } from "@jest/globals";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../submodel-base/submodel-base";
import { createAasObject } from "./aas-object";
import { Permission } from "./permission";
import { PermissionPerObject } from "./permission-per-object";
import { Security } from "./security";
import { SubjectAttributes } from "./subject-attributes";

describe("security", () => {
  it("create security schema and checks permissions", () => {
    const security = Security.create({ });
    security.addPolicy(SubjectAttributes.create({ role: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(SubjectAttributes.create({ role: UserRole.USER }), IdShortPath.create({ path: "section1.field1" }), [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(SubjectAttributes.create({ role: UserRole.USER }));
    expect(ability.can(
      Permissions.Read,
      IdShortPath.create({ path: "section1" }),
    )).toBeTruthy();
    expect(ability.can(
      Permissions.Edit,
      IdShortPath.create({ path: "section1.field1" }),
    )).toBeTruthy();
    // the specific rule of the field1 should override general rule of section1
    expect(ability.can(
      Permissions.Read,
      IdShortPath.create({ path: "section1.field1" }),
    )).toBeFalsy();
    // sub elements of section1 should inherit the rule of section1 if not overridden
    expect(ability.can(
      Permissions.Read,
      IdShortPath.create({ path: "section1.field2" }),
    )).toBeTruthy();
    expect(ability.can(
      Permissions.Read,
      IdShortPath.create({ path: "section1.subsection1.field1" }),
    )).toBeTruthy();

    ability = security.defineAbilityForSubject(SubjectAttributes.create({ role: UserRole.ADMIN }));
    expect(ability.can(
      Permissions.Read,
      IdShortPath.create({ path: "section1" }),
    )).toBeFalsy();
  });

  it("should add policy fails if it already exists", () => {
    const security = Security.create({ });
    security.addPolicy(SubjectAttributes.create({ role: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    expect(() => security.addPolicy(SubjectAttributes.create({ role: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })])).toThrow(
      new ValueError(`Permission for subject { role: user } and object section1 already exists`),
    );
  });

  it("return security rule for given subject", () => {
    const security = Security.create({ });
    security.addPolicy(SubjectAttributes.create({ role: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(SubjectAttributes.create({ role: MemberRole.MEMBER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);

    security.addPolicy(SubjectAttributes.create({ role: MemberRole.MEMBER }), IdShortPath.create({ path: "section2" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
    ]);
    expect(security.findPoliciesBySubject(SubjectAttributes.create({ role: UserRole.USER }))).toEqual([
      {
        targetSubjectAttributes: SubjectAttributes.create({ role: UserRole.USER }),
        permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section1" })),
            permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
          }),
        ],
      },
    ]);
    expect(security.findPoliciesBySubject(SubjectAttributes.create({ role: MemberRole.MEMBER }))).toEqual([
      {
        targetSubjectAttributes: SubjectAttributes.create({ role: MemberRole.MEMBER }),
        permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section1" })),
            permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
          }),
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section2" })),
            permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }), Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })],
          }),
        ],
      },
    ]);
  });

  it("return plain for security", () => {
    const security = Security.create({ });
    security.addPolicy(SubjectAttributes.create({ role: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(SubjectAttributes.create({ role: MemberRole.MEMBER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);

    security.addPolicy(SubjectAttributes.create({ role: MemberRole.MEMBER }), IdShortPath.create({ path: "section2" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
    ]);
    expect(security.toPlain({ filterBySubject: SubjectAttributes.create({ role: UserRole.USER }) })).toEqual({
      localAccessControl: {
        accessPermissionRules: [{
          permissionsPerObject: [
            {
              object: {
                category: null,
                description: [],
                displayName: [],
                embeddedDataSpecifications: [],
                extensions: [],
                idShort: "section1",
                modelType: "ReferenceElement",
                qualifiers: [],
                semanticId: null,
                supplementalSemanticIds: [],
                value: null,
              },
              permissions: [
                {
                  kindOfPermission: "Allow",
                  permission: "Read",
                },
              ],
            },
          ],
          targetSubjectAttributes: {
            subjectAttribute: [
              {
                category: null,
                description: [],
                displayName: [],
                embeddedDataSpecifications: [],
                extensions: [],
                idShort: "role",
                modelType: "Property",
                qualifiers: [],
                semanticId: null,
                supplementalSemanticIds: [],
                value: "user",
                valueId: null,
                valueType: "String",
              },
            ],
          },
        }],
      },
    });
  });
});
