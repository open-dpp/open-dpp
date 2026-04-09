import { expect, it } from "@jest/globals";
import { PermissionKind, Permissions } from "@open-dpp/dto";
import { ForbiddenError, ValueError } from "@open-dpp/exception";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../common/id-short-path";
import { createAasObject } from "./aas-object";
import { AccessPermissionRule } from "./access-permission-rule";
import { Permission } from "./permission";
import { PermissionPerObject } from "./permission-per-object";
import { Security } from "./security";
import { SubjectAttributes } from "./subject-attributes";

describe("security", () => {
  const policyManagementError = "Administrator has no permission to add/ modify/ delete policy.";
  it("create security schema and checks permissions", () => {
    const security = Security.create({ });
    security.addPolicy(
      SubjectAttributes.create({ userRole: UserRole.USER }),
      IdShortPath.create({ path: "section1" }),
      [
        Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
        Permission.create({ permission: Permissions.Delete, kindOfPermission: PermissionKind.Allow }),
      ],
    );
    security.addPolicy(
      SubjectAttributes.create({ userRole: UserRole.USER }),
      IdShortPath.create({ path: "section1.field1" }),
      [
        Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
        Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
      ],
    );
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
      Permissions.Delete,
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
    )).toBeFalsy();
  });

  it("should add policy fails if it already exists", () => {
    const security = Security.create({ });
    security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    expect(
      () => security.addPolicy(
        SubjectAttributes.create({ userRole: UserRole.USER }),
        IdShortPath.create({ path: "section1" }),
        [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
      ),
    ).toThrow(
      new ValueError(`Permission for subject { userRole: user, memberRole: undefined } and object section1 already exists`),
    );
  });

  it("should add policy fails if create, edit or delete is added without read", () => {
    const security = Security.create({ });
    [Permissions.Create, Permissions.Edit, Permissions.Delete].forEach((permission) => {
      expect(() => security.addPolicy(
        SubjectAttributes.create({ userRole: UserRole.USER }),
        IdShortPath.create({ path: "section1" }),
        [Permission.create({ permission, kindOfPermission: PermissionKind.Allow })],
      )).toThrow(
        new ValueError(`Permission ${permission} is not allowed without Read permission.`),
      );
    });
  });

  it("modify policy fails if create, edit or delete is added without read", () => {
    const security = Security.create({ });
    security.addPolicy(
      SubjectAttributes.create({ userRole: UserRole.USER }),
      IdShortPath.create({ path: "section1" }),
      [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
    );
    [Permissions.Create, Permissions.Edit, Permissions.Delete].forEach((permission) => {
      expect(() => security.modifyPolicy(
        SubjectAttributes.create({ userRole: UserRole.USER }),
        IdShortPath.create({ path: "section1" }),
        [Permission.create({ permission, kindOfPermission: PermissionKind.Allow })],
      )).toThrow(
        new ValueError(`Permission ${permission} is not allowed without Read permission.`),
      );
    });
  });

  it("should check permission of administrator to add policy", () => {
    let security = Security.create({ }).withAdministrator(SubjectAttributes.create({ userRole: UserRole.USER }));
    const expectedError = new ForbiddenError(policyManagementError);
    expect(() => security.addPolicy(SubjectAttributes.create({ userRole: UserRole.USER }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })])).toThrow(
      expectedError,
    );

    expect(() => security.addPolicy(SubjectAttributes.create({ userRole: UserRole.ADMIN }), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })])).toThrow(
      expectedError,
    );

    security = Security.create({ }).withAdministrator(SubjectAttributes.create({ userRole: UserRole.ADMIN }));

    expect(
      () => security.addPolicy(
        SubjectAttributes.create({ userRole: UserRole.ADMIN }),
        IdShortPath.create({ path: "section1" }),
        [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
      ),
    ).not.toThrow(
    );

    security = Security.create({ }).withAdministrator(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }));
    expect(
      () => security.addPolicy(
        SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
        IdShortPath.create({ path: "section1" }),
        [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
      ),
    ).toThrow(
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
        permission: Permissions.Read,
        kindOfPermission: PermissionKind.Allow,
      }),
      Permission.create({
        permission: Permissions.Create,
        kindOfPermission: PermissionKind.Allow,
      }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
    ]);
    expect(security.findPoliciesBySubject(SubjectAttributes.create({ userRole: UserRole.ADMIN }))).toEqual([
      {
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.ADMIN }),
        _permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section1" })),
            permissions: [
              Permission.create({
                permission: Permissions.Read,
                kindOfPermission: PermissionKind.Allow,
              }),
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
    ])).toThrow(new ForbiddenError(policyManagementError));
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
        _permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section1" })),
            permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }), Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow })],
          }),
        ],
      },
    ]);
  });

  it("return policies for given subject", () => {
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
        _permissionsPerObject: [
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
        _permissionsPerObject: [
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

    expect(security.findPoliciesBySubject(SubjectAttributes.create({ userRole: UserRole.ADMIN }))).toEqual([
      {
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.ADMIN }),
        _permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "adminSection" })),
            permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
          }),
        ],
      },
    ]);
  });

  it("should delete policies by object", () => {
    const security = Security.create({ });
    const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    security.addPolicy(SubjectAttributes.create(admin), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(SubjectAttributes.create(admin), IdShortPath.create({ path: "section1.subSection1.prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);

    security.addPolicy(SubjectAttributes.create(member), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(SubjectAttributes.create(member), IdShortPath.create({ path: "section2" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);

    const pathToDelete = IdShortPath.create({ path: "section1" });
    expect(() => security.withAdministrator(member).deletePoliciesByObjectPath(pathToDelete)).toThrow(new ForbiddenError(policyManagementError));

    security.withAdministrator(admin).deletePoliciesByObjectPath(pathToDelete);
    expect(security.findPoliciesBySubject(admin)).toEqual([]);
    expect(security.findPoliciesBySubject(member)).toEqual([
      {
        targetSubjectAttributes: SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
        _permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section2" })),
            permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
          }),
        ],
      },
    ]);
  });

  it("should delete policy by object and subject", () => {
    const security = Security.create({ });
    const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    security.addPolicy(SubjectAttributes.create(admin), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(SubjectAttributes.create(admin), IdShortPath.create({ path: "section1.subSection1.prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);

    security.addPolicy(SubjectAttributes.create(member), IdShortPath.create({ path: "section1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    security.addPolicy(SubjectAttributes.create(member), IdShortPath.create({ path: "section2" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);

    const objectToDelete = IdShortPath.create({ path: "section1" });
    expect(() => security.withAdministrator(member).deletePolicyBySubjectAndObject(admin, objectToDelete)).toThrow(new ForbiddenError(policyManagementError));

    security.withAdministrator(admin).deletePolicyBySubjectAndObject(admin, objectToDelete);
    expect(security.findPoliciesBySubject(admin)).toEqual([
      {
        targetSubjectAttributes: admin,
        _permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section1.subSection1.prop1" })),
            permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
          }),
        ],
      },
    ]);
    expect(security.findPoliciesBySubject(member)).toEqual([
      {
        targetSubjectAttributes: member,
        _permissionsPerObject: [
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section1" })),
            permissions: [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
          }),
          PermissionPerObject.create({
            object: createAasObject(IdShortPath.create({ path: "section2" })),
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
    const ability = security.defineAbilityForSubject(SubjectAttributes.create({ userRole: UserRole.USER }));
    expect(security.toPlain({ ability })).toEqual({
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

    const ability2 = security.defineAbilityForSubject(SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }));
    expect(security.toPlain({ ability: ability2 })).toEqual({
      localAccessControl: {
        accessPermissionRules: [
          {
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
              {
                object: {
                  category: null,
                  description: [],
                  displayName: [],
                  embeddedDataSpecifications: [],
                  extensions: [],
                  idShort: "section2",
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
                  {
                    kindOfPermission: "Allow",
                    permission: "Edit",
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
                {
                  category: null,
                  description: [],
                  displayName: [],
                  embeddedDataSpecifications: [],
                  extensions: [],
                  idShort: "memberRole",
                  modelType: "Property",
                  qualifiers: [],
                  semanticId: null,
                  supplementalSemanticIds: [],
                  value: "member",
                  valueId: null,
                  valueType: "String",
                },
              ],
            },
          },
          {
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
          },
        ],
      },
    });
  });
});
