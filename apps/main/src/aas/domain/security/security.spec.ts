import { expect, it } from "@jest/globals";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { ForbiddenError, ValueError } from "@open-dpp/exception";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../submodel-base/submodel-base";
import { createAasObject } from "./aas-object";
import { AccessPermissionRule } from "./access-permission-rule";
import { Permission } from "./permission";
import { PermissionPerObject } from "./permission-per-object";
import { Security } from "./security";
import { SubjectAttributes } from "./subject-attributes";

describe("security", () => {
  it("create security schema and checks permissions", () => {
    const security = Security.create({ });
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER }), IdShortPath.create({ path: "section1.field1" }), [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(SubjectAttributes.create({ userRole: UserRole.USER }));
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

    ability = security.defineAbilityForSubject(SubjectAttributes.create({ userRole: UserRole.ADMIN }));
    expect(ability.can(
      Permissions.Read,
      IdShortPath.create({ path: "section1" }),
    )).toBeTruthy();
  });

  it("should add policy fails if it already exists", () => {
    const security = Security.create({ });
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    expect(() => security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })])).toThrow(
      new ValueError(`Permission for subject { userRole: user, memberRole: undefined } and object section1 already exists`),
    );
  });

  it("should check permission of administrator to add policy", () => {
    let security = Security.create({ }).withAdministrator(SubjectAttributes.create({ userRole: UserRole.USER }));
    const expectedError = new ForbiddenError(`Administrator has no permission to add/ modify policy.`);
    expect(() => security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })])).toThrow(
      expectedError,
    );

    expect(() => security.addPolicy(SubjectAttributes.create({ userRole: UserRole.ADMIN }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })])).toThrow(
      expectedError,
    );

    security = Security.create({ }).withAdministrator(SubjectAttributes.create({ userRole: UserRole.ADMIN }));

    expect(() => security.addPolicy(SubjectAttributes.create({ userRole: UserRole.ADMIN }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })])).not.toThrow(
    );

    security = Security.create({ }).withAdministrator(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }));
    expect(() => security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })])).toThrow(
      expectedError,
    );
  });

  it("should modify policy", () => {
    const security = Security.create({});
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.ADMIN }), IdShortPath.create({ path: "section1" }), [Permission.create({
      permission: Permissions.Read,
      kindOfPermission: PermissionKind.Allow,
    })]);
    security.modifyPolicy(SubjectAttributes.create({ userRole: UserRole.ADMIN }), IdShortPath.create({ path: "section1" }), [
      Permission.create({
        permission: Permissions.Create,
        kindOfPermission: PermissionKind.Allow,
      }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
    ]);
    expect(security.findPoliciesBySubject(SubjectAttributes.create({ userRole: UserRole.ADMIN }))).toEqual([
      {
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.ADMIN }),
        permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section1" })),
            permissions: [
              Permission.create({
                permission: Permissions.Create,
                kindOfPermission: PermissionKind.Allow,
              }),
              Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
            ],
          }),
        ],
      },
    ]);

    expect(() => security.withAdministrator(SubjectAttributes.create({ userRole: UserRole.USER })).modifyPolicy(SubjectAttributes.create({ userRole: UserRole.ADMIN }), IdShortPath.create({ path: "section1" }), [
      Permission.create({
        permission: Permissions.Create,
        kindOfPermission: PermissionKind.Allow,
      }),
    ])).toThrow(new ForbiddenError(`Administrator has no permission to add/ modify policy.`));
  });

  it("should apply rules", () => {
    const security = Security.create({ });
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    const modifications = [AccessPermissionRule.create({
      targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.USER }),
      permissionsPerObject: [
        PermissionPerObject.create({
          object: createAasObject(IdShortPath.create({ path: "section1" })),
          permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }), Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })],
        }),
      ],
    })];
    security.applyModifiedRules(modifications);
    expect(security.findPoliciesBySubject(SubjectAttributes.create({ userRole: UserRole.USER }))).toEqual([
      {
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.USER }),
        permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section1" })),
            permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }), Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })],
          }),
        ],
      },
    ]);
  });

  it("return security rule for given subject", () => {
    const security = Security.create({ });
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.ADMIN }), IdShortPath.create({ path: "adminSection" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);

    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);

    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }), IdShortPath.create({ path: "section2" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
    ]);
    expect(security.findPoliciesBySubject(SubjectAttributes.create({ userRole: UserRole.USER }))).toEqual([
      {
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.USER }),
        permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section1" })),
            permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
          }),
        ],
      },
    ]);
    expect(security.findPoliciesBySubject(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }))).toEqual([
      {
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
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
      {
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.USER }),
        permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section1" })),
            permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
          }),
        ],
      },
    ]);

    expect(security.findPoliciesBySubject(SubjectAttributes.create({ userRole: UserRole.ADMIN }))).toEqual([
      {
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.ADMIN }),
        permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "adminSection" })),
            permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
          }),
        ],
      },
      {
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
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
      {
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.USER }),
        permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section1" })),
            permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
          }),
        ],
      },
    ]);
  });

  it("return plain for security", () => {
    const security = Security.create({ });
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);

    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }), IdShortPath.create({ path: "section2" }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
    ]);
    expect(security.toPlain({ filterBySubject: SubjectAttributes.create({ userRole: UserRole.USER }) })).toEqual({
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
                idShort: "userRole",
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
