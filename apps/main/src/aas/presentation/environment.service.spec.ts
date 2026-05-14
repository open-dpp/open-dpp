import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { expect, jest } from "@jest/globals";

import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import {
  AasSubmodelElements,
  AssetKind,
  DataTypeDef,
  KeyTypes,
  LanguageTextDto,
  MemberRoleDto,
  PermissionKind,
  Permissions,
  SubmodelElementSchema,
  SubmodelJsonSchema,
  UserRoleDto,
} from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { ForbiddenError } from "@open-dpp/exception";
import { securityPlainFactory, SecurityPlainTransientParams } from "@open-dpp/testing";
import { Connection } from "mongoose";
import { generateMongoConfig } from "../../database/config";

import { AuthModule } from "../../identity/auth/auth.module";

import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { OrganizationsModule } from "../../identity/organizations/organizations.module";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { UsersModule } from "../../identity/users/users.module";
import { Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PassportsModule } from "../../passports/passports.module";
import { AasModule } from "../aas.module";
import { AssetAdministrationShell } from "../domain/asset-adminstration-shell";
import { AssetInformation } from "../domain/asset-information";
import { IdShortPath } from "../domain/common/id-short-path";
import { LanguageText } from "../domain/common/language-text";
import { Environment } from "../domain/environment";
import { createAasObject } from "../domain/security/aas-object";
import { Permission } from "../domain/security/permission";
import { PermissionPerObject } from "../domain/security/permission-per-object";
import { Security } from "../domain/security/security";
import { SubjectAttributes } from "../domain/security/subject-attributes";
import { Property } from "../domain/submodel-base/property";
import { Submodel } from "../domain/submodel-base/submodel";
import { SubmodelElementCollection } from "../domain/submodel-base/submodel-element-collection";
import { SubmodelElementList } from "../domain/submodel-base/submodel-element-list";
import { AasRepository } from "../infrastructure/aas.repository";
import { ConceptDescriptionRepository } from "../infrastructure/concept-description.repository";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import { EnvironmentService } from "./environment.service";
import { randomUUID } from "node:crypto";
import { ActivityHistoryModule } from "../../activity-history/activity-history.module";
import { ActivityRepository } from "../../activity-history/infrastructure/activity.repository";
import { ActivityTypes } from "../../activity-history/activity-types";
import { AdministrativeInformation } from "../domain/common/administrative-information";
import { DbSessionOptions } from "../../database/query-options";
import { SubmodelCreateActivityPayload } from "../../activity-history/aas/asset-administration-shell/submodel-create.payload";
import { SubmodelPayload } from "../../activity-history/aas/submodel.activity";
import { SubmodelOperationTypes } from "../../activity-history/submodel-operation-types";
import { Operation } from "json-diff-ts";
import { AssetAdministrationShellPayload } from "../../activity-history/aas/asset-administration-shell.activity";
import { AssetAdministrationShellOperationTypes } from "../../activity-history/asset-administration-shell-operation-types";

describe("environmentService", () => {
  let environmentService: EnvironmentService;
  let aasRepository: AasRepository;
  let submodelRepository: SubmodelRepository;
  let module: TestingModule;
  let passportRepository: PassportRepository;
  let conceptDescriptionRepository: ConceptDescriptionRepository;
  let connection: Connection;
  let activityRepository: ActivityRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        PassportsModule,
        AasModule,
        AuthModule,
        OrganizationsModule,
        UsersModule,
        ActivityHistoryModule,
      ],
    }).compile();
    await module.init();
    environmentService = module.get<EnvironmentService>(EnvironmentService);
    passportRepository = module.get<PassportRepository>(PassportRepository);
    aasRepository = module.get<AasRepository>(AasRepository);
    submodelRepository = module.get<SubmodelRepository>(SubmodelRepository);
    connection = module.get<Connection>(getConnectionToken());
    conceptDescriptionRepository = module.get<ConceptDescriptionRepository>(
      ConceptDescriptionRepository,
    );
    activityRepository = module.get<ActivityRepository>(ActivityRepository);
  });

  it("should create environment", async () => {
    const displayName: LanguageTextDto[] = [{ language: "en", text: "Test AAS" }];
    const description: LanguageTextDto[] = [{ language: "en", text: "Test AAS description" }];
    const environment = await environmentService.createEnvironment(
      {
        assetAdministrationShells: [{ displayName, description }],
      },
      true,
    );
    expect(environment.assetAdministrationShells).toHaveLength(1);
    const aas = await aasRepository.findOneOrFail(environment.assetAdministrationShells[0]);
    expect(aas.assetInformation.assetKind).toEqual(AssetKind.Type);
    expect(aas.displayName).toEqual(displayName.map(LanguageText.fromPlain));
    expect(aas.description).toEqual(description.map(LanguageText.fromPlain));
  });

  it("should create environment with empty aas", async () => {
    const environment = await environmentService.createEnvironment(
      {
        assetAdministrationShells: [],
      },
      false,
    );
    expect(environment.assetAdministrationShells).toHaveLength(1);
    const aas = await aasRepository.findOneOrFail(environment.assetAdministrationShells[0]);
    expect(aas.assetInformation.assetKind).toEqual(AssetKind.Instance);
  });

  it("should populate paging result", async () => {
    const assetAdministrationShell = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: AssetKind.Instance }),
    });
    const environment = Environment.create({
      assetAdministrationShells: [assetAdministrationShell.id],
    });
    await aasRepository.save(assetAdministrationShell);
    const passport = Passport.create({ environment, organizationId: "organizationId" });
    await passportRepository.save(passport);
    const pagingResult = PagingResult.create({
      pagination: Pagination.create({}),
      items: [passport],
    });
    const subject = SubjectAttributes.create({ userRole: UserRole.ADMIN });
    const result = await environmentService.populateEnvironmentForPagingResult(
      pagingResult,
      { assetAdministrationShells: true, ignoreMissing: false },
      subject,
    );
    expect(result.toPlain()).toEqual({
      result: [
        {
          ...passport.toPlain(),
          environment: {
            ...environment.toPlain(),
            assetAdministrationShells: [assetAdministrationShell.toPlain()],
          },
        },
      ],
      paging_metadata: {
        cursor: null,
      },
    });
  });

  it("should load security policies for given subject", async () => {
    const security = Security.create({});
    security.addPolicy(
      SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
      IdShortPath.create({ path: "section1" }),
      [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
    );
    security.addPolicy(
      SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
      IdShortPath.create({ path: "section2" }),
      [
        Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
        Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
      ],
    );

    const assetAdministrationShell = AssetAdministrationShell.create({
      assetInformation: AssetInformation.create({ assetKind: AssetKind.Instance }),
      security,
    });
    await aasRepository.save(assetAdministrationShell);
    const environment = Environment.create({
      assetAdministrationShells: [assetAdministrationShell.id],
    });
    await aasRepository.save(assetAdministrationShell);
    const subject = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const result = await environmentService.loadAbility(environment, subject);
    expect(result.can(Permissions.Read, IdShortPath.create({ path: "section1" }))).toBeTruthy();
  });

  it("should modify asset administration shell", async () => {
    const digitalProductDocumentId = randomUUID();
    const userId = randomUUID();
    const security = Security.create({});
    security.addPolicy(
      SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
      IdShortPath.create({ path: "section1" }),
      [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })],
    );
    const assetAdministrationShell = AssetAdministrationShell.create({ security });
    await aasRepository.save(assetAdministrationShell);
    const environment = Environment.create({
      assetAdministrationShells: [assetAdministrationShell.id],
    });

    const transientParams: SecurityPlainTransientParams = {
      policies: [
        {
          subject: {
            userRole: UserRoleDto.USER,
            memberRole: MemberRoleDto.MEMBER,
          },
          object: { idShortPath: "section1" },
          permissions: [
            {
              permission: Permissions.Read,
              kindOfPermission: PermissionKind.Allow,
            },
            {
              permission: Permissions.Create,
              kindOfPermission: PermissionKind.Allow,
            },
            {
              permission: Permissions.Edit,
              kindOfPermission: PermissionKind.Allow,
            },
          ],
        },
      ],
    };
    const modification = {
      security: securityPlainFactory.build(undefined, { transient: transientParams }),
    };
    const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });
    await environmentService.modifyAasShell(
      digitalProductDocumentId,
      environment,
      assetAdministrationShell.id,
      modification,
      { subject: admin, userId },
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);

    expect(foundActivities.items.map((e) => ({ type: e.header.type, payload: e.payload }))).toEqual(
      [
        {
          type: ActivityTypes.AssetAdministrationShellActivity,
          payload: AssetAdministrationShellPayload.create({
            assetAdministrationShellId: assetAdministrationShell.id,
            administration: AdministrativeInformation.create({ version: "2", revision: "0" }),
            operation: AssetAdministrationShellOperationTypes.AssetAdministrationShellModification,
            changes: [
              {
                key: "security",
                type: Operation.UPDATE,
                changes: [
                  {
                    key: "localAccessControl",
                    type: Operation.UPDATE,
                    changes: [
                      {
                        embeddedKey: "$index",
                        key: "accessPermissionRules",
                        type: Operation.UPDATE,
                        changes: [
                          {
                            key: "0",
                            type: Operation.UPDATE,
                            changes: [
                              {
                                embeddedKey: "object.idShort",
                                key: "permissionsPerObject",
                                type: Operation.UPDATE,
                                embeddedKeyIsPath: true,
                                changes: [
                                  {
                                    key: "section1",
                                    type: Operation.UPDATE,
                                    changes: [
                                      {
                                        embeddedKey: "permission",
                                        key: "permissions",
                                        type: Operation.UPDATE,
                                        changes: [
                                          {
                                            key: "Create",
                                            type: Operation.ADD,
                                            value: {
                                              kindOfPermission: "Allow",
                                              permission: "Create",
                                            },
                                          },
                                          {
                                            key: "Edit",
                                            type: Operation.ADD,
                                            value: {
                                              kindOfPermission: "Allow",
                                              permission: "Edit",
                                            },
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        },
      ],
    );

    const foundAas = await aasRepository.findOneOrFail(assetAdministrationShell.id);
    expect(
      foundAas.security.findPoliciesBySubject(
        SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
      ),
    ).toEqual([
      {
        targetSubjectAttributes: SubjectAttributes.create({
          userRole: UserRole.USER,
          memberRole: MemberRole.MEMBER,
        }),
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
              Permission.create({
                permission: Permissions.Edit,
                kindOfPermission: PermissionKind.Allow,
              }),
            ],
          }),
        ],
      },
    ]);
  });

  it("should modify asset administration shell fails due to insufficient permissions", async () => {
    const digitalProductDocumentId = randomUUID();
    const userId = randomUUID();
    const security = Security.create({});
    security.addPolicy(
      SubjectAttributes.create({ userRole: UserRole.ADMIN }),
      IdShortPath.create({ path: "section1" }),
      [
        Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
        Permission.create({
          permission: Permissions.Create,
          kindOfPermission: PermissionKind.Allow,
        }),
      ],
    );
    const assetAdministrationShell = AssetAdministrationShell.create({ security });
    await aasRepository.save(assetAdministrationShell);
    const environment = Environment.create({
      assetAdministrationShells: [assetAdministrationShell.id],
    });

    const transientParams: SecurityPlainTransientParams = {
      policies: [
        {
          subject: {
            userRole: UserRoleDto.ADMIN,
          },
          object: { idShortPath: "section1" },
          permissions: [
            {
              permission: Permissions.Create,
              kindOfPermission: PermissionKind.Allow,
            },
            {
              permission: Permissions.Edit,
              kindOfPermission: PermissionKind.Allow,
            },
          ],
        },
      ],
    };

    await expect(
      environmentService.modifyAasShell(
        digitalProductDocumentId,
        environment,
        assetAdministrationShell.id,
        { security: securityPlainFactory.build(undefined, { transient: transientParams }) },
        {
          subject: SubjectAttributes.create({
            userRole: UserRole.USER,
            memberRole: MemberRole.MEMBER,
          }),
          userId,
        },
      ),
    ).rejects.toThrow(
      new ForbiddenError("Administrator has no permission to add/ modify/ delete policy."),
    );
  });

  async function createDefaultEnvironment() {
    const digitalProductDocumentId = randomUUID();
    const security = Security.create({});
    const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });
    const adminUserId = randomUUID();
    const memberUserId = randomUUID();
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    security.addPolicy(admin, IdShortPath.create({ path: "section1" }), [
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
      Permission.create({
        permission: Permissions.Read,
        kindOfPermission: PermissionKind.Allow,
      }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Delete, kindOfPermission: PermissionKind.Allow }),
    ]);

    security.addPolicy(member, IdShortPath.create({ path: "section1" }), [
      Permission.create({
        permission: Permissions.Read,
        kindOfPermission: PermissionKind.Allow,
      }),
    ]);
    const ability = security.defineAbilityForSubject(admin, adminUserId);

    const submodel1 = Submodel.create({ idShort: "section1" });
    const submodelElementCollection1 = SubmodelElementCollection.create({ idShort: "subSection1" });
    submodel1.addSubmodelElement(submodelElementCollection1, { ability, digitalProductDocumentId });

    const property1 = Property.create({ idShort: "property1", valueType: DataTypeDef.String });
    const property2 = Property.create({ idShort: "property2", valueType: DataTypeDef.String });
    submodelElementCollection1.addSubmodelElement(property1, { ability, digitalProductDocumentId });
    submodelElementCollection1.addSubmodelElement(property2, { ability, digitalProductDocumentId });

    await submodelRepository.save(submodel1);
    const assetAdministrationShell = AssetAdministrationShell.create({ security });
    assetAdministrationShell.addSubmodel(submodel1, { digitalProductDocumentId, ability });
    await aasRepository.save(assetAdministrationShell);

    const environment = Environment.create({
      assetAdministrationShells: [assetAdministrationShell.id],
      submodels: [submodel1.id],
    });
    return {
      digitalProductDocumentId,
      environment,
      admin: { subject: admin, userId: adminUserId },
      member: { subject: member, userId: memberUserId },
      submodel1,
      submodelElementCollection1,
      property1,
      property2,
    };
  }

  it("should add submodel", async () => {
    const { digitalProductDocumentId, environment, admin } = await createDefaultEnvironment();
    const submodelPlain = {
      id: randomUUID(),
      idShort: "submodel2",
      modelType: KeyTypes.Submodel,
      displayName: [],
      description: [],
      supplementalSemanticIds: [],
      qualifiers: [],
      embeddedDataSpecifications: [],
    };

    async function saveEnvironment(_options: DbSessionOptions) {}

    await environmentService.addSubmodelToEnvironment(
      digitalProductDocumentId,
      environment,
      submodelPlain,
      saveEnvironment,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    expect(foundActivities.items.map((e) => ({ type: e.header.type, payload: e.payload }))).toEqual(
      [
        {
          type: ActivityTypes.SubmodelCreate,
          payload: SubmodelCreateActivityPayload.create({
            assetAdministrationShellId: environment.assetAdministrationShells[0],
            administration: AdministrativeInformation.create({ version: "3", revision: "0" }),
            data: Submodel.fromPlain(submodelPlain).toPlain(),
          }),
        },
      ],
    );
  });

  it("should add submodel element", async () => {
    const { digitalProductDocumentId, environment, admin, submodel1 } =
      await createDefaultEnvironment();
    const propertyPlain = {
      idShort: "dataField1",
      valueType: DataTypeDef.String,
      value: "test",
      modelType: KeyTypes.Property,
      displayName: [],
      description: [],
      supplementalSemanticIds: [],
      qualifiers: [],
      embeddedDataSpecifications: [],
    };

    await environmentService.addSubmodelElement(
      digitalProductDocumentId,
      environment,
      submodel1.id,
      propertyPlain,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    expect(foundActivities.items.map((e) => ({ type: e.header.type, payload: e.payload }))).toEqual(
      [
        {
          type: ActivityTypes.SubmodelActivity,
          payload: SubmodelPayload.create({
            submodelId: submodel1.id,
            administration: AdministrativeInformation.create({ version: "3", revision: "0" }),
            fullIdShortPath: IdShortPath.create({ path: submodel1.idShort }),
            operation: SubmodelOperationTypes.SubmodelElementCreate,
            changes: [
              {
                embeddedKey: "idShort",
                key: "submodelElements",
                type: Operation.UPDATE,
                changes: [
                  {
                    key: "dataField1",
                    type: Operation.ADD,
                    value: {
                      description: [],
                      displayName: [],
                      embeddedDataSpecifications: [],
                      extensions: [],
                      qualifiers: [],
                      supplementalSemanticIds: [],
                      category: null,
                      idShort: "dataField1",
                      modelType: "Property",
                      semanticId: null,
                      value: "test",
                      valueId: null,
                      valueType: "String",
                    },
                  },
                ],
              },
            ],
          }),
        },
      ],
    );
  });

  it("should add column", async () => {
    const { digitalProductDocumentId, listIdShortPath, environment, admin, submodel1, row1 } =
      await createEnvironmentWithList();
    const column = Property.create({
      idShort: "column1",
      valueType: DataTypeDef.String,
      value: "test",
    });
    const position = 3;

    await environmentService.addColumn(
      digitalProductDocumentId,
      environment,
      submodel1.id,
      listIdShortPath,
      column,
      admin,
      position,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    expect(foundActivities.items.map((e) => ({ type: e.header.type, payload: e.payload }))).toEqual(
      [
        {
          type: ActivityTypes.SubmodelActivity,
          payload: SubmodelPayload.create({
            submodelId: submodel1.id,
            administration: AdministrativeInformation.create({ version: "4", revision: "0" }),
            fullIdShortPath: IdShortPath.create({ path: submodel1.idShort }).concat(
              listIdShortPath,
            ),
            changes: [
              {
                embeddedKey: "idShort",
                key: "value",
                type: Operation.UPDATE,
                changes: [
                  {
                    key: row1.idShort,
                    type: Operation.UPDATE,
                    changes: [
                      {
                        embeddedKey: "idShort",
                        key: "value",
                        type: Operation.UPDATE,
                        changes: [
                          {
                            key: "column1",
                            type: Operation.ADD,
                            value: {
                              category: null,
                              description: [],
                              displayName: [],
                              embeddedDataSpecifications: [],
                              extensions: [],
                              idShort: "column1",
                              modelType: "Property",
                              qualifiers: [],
                              semanticId: null,
                              supplementalSemanticIds: [],
                              value: "test",
                              valueId: null,
                              valueType: "String",
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
            operation: SubmodelOperationTypes.SubmodelColumnCreate,
          }),
        },
      ],
    );
  });

  it("should add row", async () => {
    const { digitalProductDocumentId, listIdShortPath, environment, admin, submodel1 } =
      await createEnvironmentWithList();
    const position = 3;

    await environmentService.addRow(
      digitalProductDocumentId,
      environment,
      submodel1.id,
      listIdShortPath,
      admin,
      position,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    expect(foundActivities.items.map((e) => ({ type: e.header.type, payload: e.payload }))).toEqual(
      [
        {
          type: ActivityTypes.SubmodelActivity,
          payload: SubmodelPayload.create({
            submodelId: submodel1.id,
            administration: AdministrativeInformation.create({ version: "4", revision: "0" }),
            fullIdShortPath: IdShortPath.create({ path: submodel1.idShort }).concat(
              listIdShortPath,
            ),
            changes: [
              {
                embeddedKey: "$index",
                key: "value",
                type: Operation.UPDATE,
                changes: [
                  {
                    key: "1",
                    type: Operation.ADD,
                    value: {
                      category: null,
                      description: [],
                      displayName: [],
                      embeddedDataSpecifications: [],
                      extensions: [],
                      idShort: expect.any(String),
                      modelType: "SubmodelElementCollection",
                      qualifiers: [],
                      semanticId: null,
                      supplementalSemanticIds: [],
                      value: [
                        {
                          category: null,
                          description: [],
                          displayName: [],
                          embeddedDataSpecifications: [],
                          extensions: [],
                          idShort: "col1",
                          modelType: "Property",
                          qualifiers: [],
                          semanticId: null,
                          supplementalSemanticIds: [],
                          value: null,
                          valueId: null,
                          valueType: "Double",
                        },
                      ],
                    },
                  },
                ],
              },
            ],
            operation: SubmodelOperationTypes.SubmodelRowCreate,
          }),
        },
      ],
    );
  });

  it("should return submodels for subject", async () => {
    const { environment, admin, member, submodel1 } = await createDefaultEnvironment();
    const pagination = Pagination.create({ limit: 10 });
    let submodels = await environmentService.getSubmodels(environment, pagination, admin.subject);
    expect(submodels.result).toEqual([SubmodelJsonSchema.parse(submodel1.toPlain())]);

    submodels = await environmentService.getSubmodels(environment, pagination, member.subject);
    expect(submodels.result).toEqual([]);
  });

  it("should return submodel by id for subject", async () => {
    const { environment, admin, submodel1 } = await createDefaultEnvironment();
    const result = await environmentService.getSubmodelById(
      environment,
      submodel1.id,
      admin.subject,
    );
    expect(result).toEqual(SubmodelJsonSchema.parse(submodel1.toPlain()));

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    await expect(
      environmentService.getSubmodelById(environment, submodel1.id, anonymous),
    ).rejects.toThrow(new ForbiddenError());
  });

  it("should return submodels elements for submodel", async () => {
    const { environment, admin, member, submodel1, submodelElementCollection1 } =
      await createDefaultEnvironment();
    const pagination = Pagination.create({ limit: 10 });
    let submodelElements = await environmentService.getSubmodelElements(
      environment,
      submodel1.id,
      pagination,
      admin.subject,
    );
    expect(submodelElements.result).toEqual([
      SubmodelElementSchema.parse(submodelElementCollection1.toPlain()),
    ]);

    submodelElements = await environmentService.getSubmodelElements(
      environment,
      submodel1.id,
      pagination,
      member.subject,
    );
    expect(submodelElements.result).toEqual([]);
  });

  it("should return submodel element by id", async () => {
    const { environment, admin, submodel1, submodelElementCollection1, property1 } =
      await createDefaultEnvironment();
    const idShortPath = IdShortPath.create({
      path: `${submodelElementCollection1.idShort}.${property1.idShort}`,
    });
    const submodelElement = await environmentService.getSubmodelElementById(
      environment,
      submodel1.id,
      idShortPath,
      admin.subject,
    );
    expect(submodelElement).toEqual(SubmodelElementSchema.parse(property1.toPlain()));
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    await expect(
      environmentService.getSubmodelElementById(environment, submodel1.id, idShortPath, anonymous),
    ).rejects.toThrow(new ForbiddenError());
  });

  it("should return value representation of submodel element by idShortPath", async () => {
    const { environment, admin, submodel1, submodelElementCollection1, property1 } =
      await createDefaultEnvironment();
    const idShortPath = IdShortPath.create({
      path: `${submodelElementCollection1.idShort}.${property1.idShort}`,
    });
    const submodelElement = await environmentService.getSubmodelElementValue(
      environment,
      submodel1.id,
      idShortPath,
      admin.subject,
    );
    expect(submodelElement).toEqual(property1.value);

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    //
    await expect(
      environmentService.getSubmodelElementValue(environment, submodel1.id, idShortPath, anonymous),
    ).rejects.toThrow(new ForbiddenError());
  });

  it("should return value representation of submodel value ", async () => {
    const { environment, admin, submodel1, property1, property2 } =
      await createDefaultEnvironment();
    const submodelValue = await environmentService.getSubmodelValue(
      environment,
      submodel1.id,
      admin.subject,
    );
    expect(submodelValue).toEqual({
      subSection1: {
        property1: property1.value,
        property2: property2.value,
      },
    });
    //

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    await expect(
      environmentService.getSubmodelValue(environment, submodel1.id, anonymous),
    ).rejects.toThrow(new ForbiddenError("Cannot access submodel section1"));
  });

  it("should modify submodel", async () => {
    const { digitalProductDocumentId, environment, admin, member, submodel1 } =
      await createDefaultEnvironment();
    const modification = {
      idShort: submodel1.idShort,
      displayName: [LanguageText.create({ text: "Test", language: "en" })],
    };
    await environmentService.modifySubmodel(
      digitalProductDocumentId,
      environment,
      submodel1.id,
      modification,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);

    expect(foundActivities.items.map((e) => ({ type: e.header.type, payload: e.payload }))).toEqual(
      [
        {
          type: ActivityTypes.SubmodelActivity,
          payload: SubmodelPayload.create({
            submodelId: submodel1.id,
            administration: AdministrativeInformation.create({ version: "3", revision: "0" }),
            fullIdShortPath: IdShortPath.create({
              path: `${submodel1.idShort}`,
            }),
            operation: SubmodelOperationTypes.SubmodelModification,
            changes: [
              {
                embeddedKey: "language",
                key: "displayName",
                type: Operation.UPDATE,
                changes: [
                  {
                    key: "en",
                    type: Operation.ADD,
                    value: {
                      language: "en",
                      text: "Test",
                    },
                  },
                ],
              },
            ],
          }),
        },
      ],
    );

    //
    await expect(
      environmentService.modifySubmodel(
        digitalProductDocumentId,
        environment,
        submodel1.id,
        modification,
        member,
      ),
    ).rejects.toThrow(new ForbiddenError("Missing permissions to modify element section1."));
  });

  it("should modify submodel value", async () => {
    const { digitalProductDocumentId, environment, admin, member, submodel1 } =
      await createDefaultEnvironment();
    const modification = {
      subSection1: {
        property1: "Test",
      },
    };

    await environmentService.modifyValueOfSubmodel(
      digitalProductDocumentId,
      environment,
      submodel1.id,
      modification,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);

    expect(foundActivities.items.map((e) => ({ type: e.header.type, payload: e.payload }))).toEqual(
      [
        {
          type: ActivityTypes.SubmodelActivity,
          payload: SubmodelPayload.create({
            submodelId: submodel1.id,
            administration: AdministrativeInformation.create({ version: "3", revision: "0" }),
            fullIdShortPath: IdShortPath.create({
              path: `${submodel1.idShort}`,
            }),
            operation: SubmodelOperationTypes.SubmodelValueModification,
            changes: [
              {
                embeddedKey: "idShort",
                key: "submodelElements",
                type: Operation.UPDATE,
                changes: [
                  {
                    key: "subSection1",
                    type: Operation.UPDATE,
                    changes: [
                      {
                        embeddedKey: "idShort",
                        key: "value",
                        type: Operation.UPDATE,
                        changes: [
                          {
                            key: "property1",
                            type: Operation.UPDATE,
                            changes: [
                              {
                                key: "value",
                                type: Operation.REMOVE,
                                value: null,
                              },
                              {
                                key: "value",
                                type: Operation.ADD,
                                value: "Test",
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        },
      ],
    );

    await expect(
      environmentService.modifyValueOfSubmodel(
        digitalProductDocumentId,
        environment,
        submodel1.id,
        modification,
        member,
      ),
    ).rejects.toThrow(
      new ForbiddenError("Missing permissions to modify element section1.subSection1.property1."),
    );
  });

  it("should modify submodel element", async () => {
    const {
      digitalProductDocumentId,
      environment,
      admin,
      member,
      submodel1,
      submodelElementCollection1,
      property1,
    } = await createDefaultEnvironment();
    const modification = {
      idShort: property1.idShort,
      displayName: [LanguageText.create({ text: "Test", language: "en" })],
    };
    const idShortPathToProperty1 = IdShortPath.create({
      path: `${submodelElementCollection1.idShort}.${property1.idShort}`,
    });
    await environmentService.modifySubmodelElement(
      digitalProductDocumentId,
      environment,
      submodel1.id,
      modification,
      idShortPathToProperty1,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    expect(foundActivities.items.map((e) => ({ type: e.header.type, payload: e.payload }))).toEqual(
      [
        {
          type: ActivityTypes.SubmodelActivity,
          payload: SubmodelPayload.create({
            submodelId: submodel1.id,
            administration: AdministrativeInformation.create({ version: "3", revision: "0" }),
            fullIdShortPath: IdShortPath.create({
              path: `${submodel1.idShort}.${idShortPathToProperty1}`,
            }),
            operation: SubmodelOperationTypes.SubmodelElementModification,
            changes: [
              {
                type: Operation.UPDATE,
                key: "displayName",
                embeddedKey: "language",
                changes: [
                  {
                    key: "en",
                    type: Operation.ADD,
                    value: {
                      language: "en",
                      text: "Test",
                    },
                  },
                ],
              },
            ],
          }),
        },
      ],
    );
    //
    await expect(
      environmentService.modifySubmodelElement(
        digitalProductDocumentId,
        environment,
        submodel1.id,
        modification,
        idShortPathToProperty1,
        member,
      ),
    ).rejects.toThrow(
      new ForbiddenError("Missing permissions to modify element section1.subSection1.property1."),
    );
  });

  it("should copy environment", async () => {
    const { environment } = await createDefaultEnvironment();
    const copy = await environmentService.copyEnvironment(environment);

    expect(copy.submodels).toHaveLength(1);
  });

  async function createEnvironmentWithList() {
    const digitalProductDocumentId = randomUUID();
    const security = Security.create({});
    const admin = SubjectAttributes.create({ userRole: UserRole.ADMIN });
    const adminUserId = randomUUID();
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const memberUserId = randomUUID();
    security.addPolicy(admin, IdShortPath.create({ path: "section1" }), [
      Permission.create({
        permission: Permissions.Read,
        kindOfPermission: PermissionKind.Allow,
      }),
      Permission.create({ permission: Permissions.Edit, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Delete, kindOfPermission: PermissionKind.Allow }),
      Permission.create({ permission: Permissions.Create, kindOfPermission: PermissionKind.Allow }),
    ]);

    const submodel1 = Submodel.create({ idShort: "section1" });
    const ability = security.defineAbilityForSubject(admin, adminUserId);

    const submodelElementList = SubmodelElementList.create({
      idShort: "list",
      typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
    });
    submodel1.addSubmodelElement(submodelElementList, { ability, digitalProductDocumentId });

    const listIdShortPath = IdShortPath.create({ path: submodelElementList.idShort });
    const col1 = Property.create({ idShort: "col1", value: "10", valueType: DataTypeDef.Double });
    submodel1.addColumn(listIdShortPath, col1, { ability });

    await submodelRepository.save(submodel1);
    const assetAdministrationShell = AssetAdministrationShell.create({ security });
    assetAdministrationShell.addSubmodel(submodel1, { digitalProductDocumentId, ability });
    await aasRepository.save(assetAdministrationShell);
    const row1 = submodelElementList.getSubmodelElements()[0];
    const environment = Environment.create({
      assetAdministrationShells: [assetAdministrationShell.id],
      submodels: [submodel1.id],
    });
    return {
      digitalProductDocumentId,
      security,
      environment,
      admin: { subject: admin, userId: adminUserId },
      member: { subject: member, userId: memberUserId },
      submodel1,
      submodelElementList,
      row1,
      col1,
      listIdShortPath,
    };
  }

  it("should modify column", async () => {
    const {
      digitalProductDocumentId,
      environment,
      admin,
      member,
      submodel1,
      row1,
      col1,
      listIdShortPath,
    } = await createEnvironmentWithList();
    const modification = {
      idShort: col1.idShort,
      displayName: [LanguageText.create({ text: "Test", language: "en" })],
    };
    await environmentService.modifyColumn(
      digitalProductDocumentId,
      environment,
      submodel1.id,
      listIdShortPath,
      col1.idShort,
      modification,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    expect(foundActivities.items.map((e) => ({ type: e.header.type, payload: e.payload }))).toEqual(
      [
        {
          type: ActivityTypes.SubmodelActivity,
          payload: SubmodelPayload.create({
            submodelId: submodel1.id,
            administration: AdministrativeInformation.create({ version: "4", revision: "0" }),
            fullIdShortPath: IdShortPath.create({
              path: `${listIdShortPath}.${col1.idShort}`,
            }),
            operation: SubmodelOperationTypes.SubmodelColumnModification,
            changes: [
              {
                embeddedKey: "idShort",
                key: "value",
                type: Operation.UPDATE,
                changes: [
                  {
                    key: row1.idShort,
                    type: Operation.UPDATE,
                    changes: [
                      {
                        key: "value",
                        type: Operation.UPDATE,
                        embeddedKey: "idShort",
                        changes: [
                          {
                            key: "col1",
                            type: Operation.UPDATE,
                            changes: [
                              {
                                embeddedKey: "language",
                                key: "displayName",
                                type: Operation.UPDATE,
                                changes: [
                                  {
                                    key: "en",
                                    type: Operation.ADD,
                                    value: {
                                      language: "en",
                                      text: "Test",
                                    },
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        },
      ],
    );
    //
    await expect(
      environmentService.modifyColumn(
        digitalProductDocumentId,
        environment,
        submodel1.id,
        listIdShortPath,
        col1.idShort,
        modification,
        member,
      ),
    ).rejects.toThrow(
      new ForbiddenError(
        `Missing permissions to modify element section1.list.${row1.idShort}.col1.`,
      ),
    );
  });

  it("should delete column", async () => {
    const { environment, admin, member, submodel1, row1, col1, listIdShortPath } =
      await createEnvironmentWithList();
    await expect(
      environmentService.deleteColumn(
        environment,
        submodel1.id,
        listIdShortPath,
        col1.idShort,
        member.subject,
      ),
    ).rejects.toThrow(
      new ForbiddenError(
        `Missing permissions to delete element section1.list.${row1.idShort}.col1.`,
      ),
    );

    const list: any = await environmentService.deleteColumn(
      environment,
      submodel1.id,
      listIdShortPath,
      col1.idShort,
      admin.subject,
    );

    expect(list.value[0].value.map((e: any) => e.idShort)).not.toContain(col1.idShort);
  });

  it("should delete row", async () => {
    const { environment, admin, member, submodel1, row1, listIdShortPath } =
      await createEnvironmentWithList();

    await expect(
      environmentService.deleteRow(
        environment,
        submodel1.id,
        listIdShortPath,
        row1.idShort,
        member.subject,
      ),
    ).rejects.toThrow(
      new ForbiddenError(`Missing permissions to delete element section1.list.${row1.idShort}.`),
    );

    const list: any = await environmentService.deleteRow(
      environment,
      submodel1.id,
      listIdShortPath,
      row1.idShort,
      admin.subject,
    );

    expect(list.value.map((e: any) => e.idShort)).not.toContain(row1.idShort);
  });

  it("should modify value of submodel element", async () => {
    const {
      digitalProductDocumentId,
      environment,
      admin,
      member,
      submodel1,
      submodelElementCollection1,
      property1,
      property2,
    } = await createDefaultEnvironment();
    const modification = { [property1.idShort]: "new value 1", [property2.idShort]: "new value 2" };
    const idShortPathToProperty1 = IdShortPath.create({
      path: `${submodelElementCollection1.idShort}`,
    });
    await environmentService.modifyValueOfSubmodelElement(
      digitalProductDocumentId,
      environment,
      submodel1.id,
      modification,
      idShortPathToProperty1,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);

    expect(foundActivities.items.map((e) => ({ type: e.header.type, payload: e.payload }))).toEqual(
      [
        {
          type: ActivityTypes.SubmodelActivity,
          payload: SubmodelPayload.create({
            submodelId: submodel1.id,
            administration: AdministrativeInformation.create({ version: "3", revision: "0" }),
            fullIdShortPath: IdShortPath.create({
              path: `${submodel1.idShort}.${idShortPathToProperty1}`,
            }),
            operation: SubmodelOperationTypes.SubmodelElementValueModification,
            changes: [
              {
                embeddedKey: "idShort",
                key: "value",
                type: Operation.UPDATE,
                changes: [
                  {
                    key: "property1",
                    type: Operation.UPDATE,
                    changes: [
                      {
                        key: "value",
                        type: Operation.REMOVE,
                        value: null,
                      },
                      {
                        key: "value",
                        type: Operation.ADD,
                        value: "new value 1",
                      },
                    ],
                  },
                  {
                    key: "property2",
                    type: Operation.UPDATE,
                    changes: [
                      {
                        key: "value",
                        type: Operation.REMOVE,
                        value: null,
                      },
                      {
                        key: "value",
                        type: Operation.ADD,
                        value: "new value 2",
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        },
      ],
    );

    //
    await expect(
      environmentService.modifyValueOfSubmodelElement(
        digitalProductDocumentId,
        environment,
        submodel1.id,
        modification,
        idShortPathToProperty1,
        member,
      ),
    ).rejects.toThrow(
      new ForbiddenError("Missing permissions to modify element section1.subSection1.property1."),
    );
  });

  it("should delete policy", async () => {
    const { environment, admin, member, submodel1 } = await createDefaultEnvironment();
    let foundAas = await aasRepository.findOneOrFail(environment.assetAdministrationShells[0]);
    expect(foundAas.security.findPoliciesBySubject(member.subject)).not.toEqual([]);

    await environmentService.deletePolicyBySubjectAndObject(
      environment,
      IdShortPath.create({ path: submodel1.idShort }),
      member.subject,
      admin.subject,
    );
    foundAas = await aasRepository.findOneOrFail(environment.assetAdministrationShells[0]);
    expect(foundAas.security.findPoliciesBySubject(member.subject)).toEqual([]);
  });

  it("should delete submodel from environment", async () => {
    const { environment, admin, member, submodel1 } = await createDefaultEnvironment();
    const saveEnvironmentMock = jest.fn<() => Promise<void>>();

    await expect(
      environmentService.deleteSubmodelFromEnvironment(
        environment,
        submodel1.id,
        saveEnvironmentMock,
        member.subject,
      ),
    ).rejects.toThrow(
      new ForbiddenError(`Missing permissions to delete element ${submodel1.idShort}.`),
    );

    await environmentService.deleteSubmodelFromEnvironment(
      environment,
      submodel1.id,
      saveEnvironmentMock,
      admin.subject,
    );
    expect(environment.submodels).not.toContain(submodel1.id);
    //
  });

  it("should delete submodel element", async () => {
    const { environment, admin, member, submodel1, submodelElementCollection1, property1 } =
      await createDefaultEnvironment();
    const idShortPath = IdShortPath.create({
      path: `${submodelElementCollection1.idShort}.${property1.idShort}`,
    });

    await expect(
      environmentService.deleteSubmodelElement(
        environment,
        submodel1.id,
        idShortPath,
        member.subject,
      ),
    ).rejects.toThrow(
      new ForbiddenError(
        `Missing permissions to delete element ${submodel1.idShort}.${idShortPath.toString()}.`,
      ),
    );

    await environmentService.deleteSubmodelElement(
      environment,
      submodel1.id,
      idShortPath,
      admin.subject,
    );
    const foundSubmodel = await submodelRepository.findOneOrFail(submodel1.id);
    expect(foundSubmodel.findSubmodelElement(idShortPath)).toBeUndefined();
    //
  });

  it("should delete all resource of environment", async () => {
    const { environment } = await createDefaultEnvironment();
    const session = await connection.startSession();
    await session.withTransaction(async () => {
      await environmentService.deleteEnvironment(environment, session);
    });
    await session.endSession();
    for (const aasId of environment.assetAdministrationShells) {
      expect(await aasRepository.findOne(aasId)).toBeUndefined();
    }
    for (const submodelId of environment.submodels) {
      expect(await submodelRepository.findOne(submodelId)).toBeUndefined();
    }
    for (const conceptDescriptionId of environment.conceptDescriptions) {
      expect(await conceptDescriptionRepository.findOne(conceptDescriptionId)).toBeUndefined();
    }
  });

  afterAll(async () => {
    await module.close();
  });
});
