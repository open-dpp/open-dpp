import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { expect, jest } from "@jest/globals";

import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import {
  AasSubmodelElements,
  ApiVersionsDto,
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
import {
  allPermissionsPlainAllow,
  securityPlainFactory,
  SecurityPlainTransientParams,
} from "@open-dpp/testing";
import { ClientSession, Connection } from "mongoose";
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
import { ConceptDescription } from "../domain/concept-description";
import { Environment } from "../domain/environment";
import { createAasObject } from "../domain/security/aas-object";
import { Permission } from "../domain/security/permission";
import { PermissionPerObject } from "../domain/security/permission-per-object";
import { Security } from "../domain/security/security";
import { SubjectAttributes } from "../domain/security/subject-attributes";
import { Property } from "../domain/submodel-base/property";
import { Submodel, submodelToReference } from "../domain/submodel-base/submodel";
import { SubmodelElementCollection } from "../domain/submodel-base/submodel-element-collection";
import { SubmodelElementList } from "../domain/submodel-base/submodel-element-list";
import { AasRepository } from "../infrastructure/aas.repository";
import { ConceptDescriptionRepository } from "../infrastructure/concept-description.repository";
import { SubmodelRepository } from "../infrastructure/submodel.repository";
import { EnvironmentService } from "./environment.service";
import { randomUUID } from "node:crypto";
import { ActivityHistoryModule } from "../../activity-history/activity-history.module";
import { ActivityRepository } from "../../activity-history/infrastructure/activity.repository";
import { DbSessionOptions } from "../../database/query-options";
import { ActivityTypes } from "../../activity-history/domain/activities/activity-types";
import {
  SubmodelActivityPayload,
  SubmodelWithAasActivityPayload,
} from "../../activity-history/domain/activities/submodel-activities.shared";
import { SubmodelElementAdded } from "../../activity-history/domain/change-events/submodel-element-added";
import { DisplayNameChanged } from "../../activity-history/domain/change-events/language-text-collection-changed";
import { PropertyValueChanged } from "../../activity-history/domain/change-events/property-value-changed";
import { SubmodelElementDeleted } from "../../activity-history/domain/change-events/submodel-element-deleted";
import { PolicyDeleted } from "../../activity-history/domain/change-events/policy-deleted";
import { AssetAdministrationShellActivityPayload } from "../../activity-history/domain/activities/aas-activities.shared";
import { PolicyAdded } from "../../activity-history/domain/change-events/policy-added";
import { PolicyModified } from "../../activity-history/domain/change-events/policy-modified";
import { ChangeTracker } from "../../activity-history/domain/change-tracker";
import { RowAdded } from "../../activity-history/domain/change-events/row-added";
import { ColumnAdded } from "../../activity-history/domain/change-events/column-added";
import { ColumnDeleted } from "../../activity-history/domain/change-events/column-deleted";
import { RowDeleted } from "../../activity-history/domain/change-events/row-deleted";
import { SubmodelReferenceAdded } from "../../activity-history/domain/change-events/submodel-reference-added";
import { AddedSubmodelToEnv } from "../../activity-history/domain/change-events/added-submodel-to-env";
import { SubmodelAdded } from "../../activity-history/domain/change-events/submodel-added";
import { SubmodelReferenceDeleted } from "../../activity-history/domain/change-events/submodel-reference-deleted";
import { DeletedSubmodelFromEnv } from "../../activity-history/domain/change-events/deleted-submodel-from-env";
import { SubmodelDeleted } from "../../activity-history/domain/change-events/submodel-deleted";
import { SubmodelElementRequest } from "./requests/submodel-element.request";
import { SubmodelRequest } from "./requests/submodel.request";
import { SubmodelModificationRequest } from "./requests/submodel-modification.request";
import { ValueModificationRequest } from "./requests/value-modification.request";
import { SubmodelElementModificationRequest } from "./requests/submodel-element-modification.request";

describe("environmentService", () => {
  let environmentService: EnvironmentService;
  let aasRepository: AasRepository;
  let submodelRepository: SubmodelRepository;
  let module: TestingModule;
  let passportRepository: PassportRepository;
  let conceptDescriptionRepository: ConceptDescriptionRepository;
  let connection: Connection;
  let activityRepository: ActivityRepository;
  const latestVersion = ApiVersionsDto.v2;

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
    const displayName: LanguageTextDto[] = [{ language: "en-US", text: "Test AAS" }];
    const description: LanguageTextDto[] = [{ language: "en-US", text: "Test AAS description" }];
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
    const correlationId = randomUUID();
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
      correlationId,
      digitalProductDocumentId,
      environment,
      assetAdministrationShell.id,
      modification,
      { subject: admin, userId },
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);

    const sectionObject = createAasObject(IdShortPath.create({ path: "section1" }));
    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.AssetAdministrationShellModified,
        payload: AssetAdministrationShellActivityPayload.create({
          aasId: assetAdministrationShell.id,
          changes: [
            PolicyModified.create({
              object: sectionObject,
              userRole: UserRole.USER,
              memberRole: MemberRole.MEMBER,
              oldValue: [
                Permission.create({
                  permission: Permissions.Read,
                  kindOfPermission: PermissionKind.Allow,
                }),
              ],
              newValue: [
                Permission.create({ kindOfPermission: "Allow", permission: Permissions.Read }),
                Permission.create({ kindOfPermission: "Allow", permission: Permissions.Create }),
                Permission.create({ kindOfPermission: "Allow", permission: Permissions.Edit }),
              ],
            }),
          ],
        }),
      },
    ]);

    const foundAas = await aasRepository.findOneOrFail(assetAdministrationShell.id);
    expect(
      foundAas.security.findPoliciesBySubject(
        SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
      ),
    ).toEqual([
      {
        tracker: expect.any(ChangeTracker),
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
    const correlationId = randomUUID();
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
        correlationId,
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
    const correlationId = randomUUID();
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
    submodel1.addSubmodelElement(submodelElementCollection1, { ability });

    const property1 = Property.create({ idShort: "property1", valueType: DataTypeDef.String });
    const property2 = Property.create({ idShort: "property2", valueType: DataTypeDef.String });
    submodelElementCollection1.addSubmodelElement(property1, { ability });
    submodelElementCollection1.addSubmodelElement(property2, { ability });

    await submodelRepository.save(submodel1);
    const assetAdministrationShell = AssetAdministrationShell.create({ security });
    assetAdministrationShell.addSubmodel(submodel1);
    await aasRepository.save(assetAdministrationShell);

    const environment = Environment.create({
      assetAdministrationShells: [assetAdministrationShell.id],
      submodels: [submodel1.id],
    });
    return {
      correlationId,
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
    const { correlationId, digitalProductDocumentId, environment, admin } =
      await createDefaultEnvironment();
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
    const request = SubmodelRequest.create({
      body: submodelPlain,
      version: ApiVersionsDto.v2,
    });

    async function saveEnvironment(_options: DbSessionOptions) {}

    await environmentService.addSubmodelToEnvironment(
      correlationId,
      digitalProductDocumentId,
      environment,
      request,
      saveEnvironment,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    const submodelAdded = Submodel.fromPlain({
      ...submodelPlain,
      administration: { version: "2", revision: "0" },
    });
    const submodelObject = createAasObject(IdShortPath.create({ path: "submodel2" }));
    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.SubmodelAdded,
        payload: SubmodelWithAasActivityPayload.create({
          submodelId: submodelPlain.id,
          aasId: environment.assetAdministrationShells[0],
          changes: [
            PolicyAdded.create({
              object: submodelObject,
              userRole: UserRole.ADMIN,
              value: allPermissionsPlainAllow.map(Permission.fromPlain),
            }),
            PolicyAdded.create({
              object: submodelObject,
              userRole: UserRole.USER,
              memberRole: MemberRole.OWNER,
              value: allPermissionsPlainAllow.map(Permission.fromPlain),
            }),
            PolicyAdded.create({
              object: submodelObject,
              userRole: UserRole.USER,
              memberRole: MemberRole.MEMBER,
              value: allPermissionsPlainAllow.map(Permission.fromPlain),
            }),
            PolicyAdded.create({
              object: submodelObject,
              userRole: UserRole.ANONYMOUS,
              value: [
                Permission.create({
                  permission: Permissions.Read,
                  kindOfPermission: PermissionKind.Allow,
                }),
              ],
            }),
            SubmodelReferenceAdded.create({
              submodelRef: submodelToReference(submodelAdded),
            }),
            AddedSubmodelToEnv.create({
              position: 1,
              submodel: submodelAdded,
            }),
            SubmodelAdded.create({
              submodel: submodelAdded,
            }),
          ],
        }),
      },
    ]);
  });

  it("should add submodel element", async () => {
    const { correlationId, digitalProductDocumentId, environment, admin, submodel1 } =
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
    const request = SubmodelElementRequest.create({
      body: propertyPlain,
      version: ApiVersionsDto.v2,
    });
    await environmentService.addSubmodelElement(
      correlationId,
      digitalProductDocumentId,
      environment,
      submodel1.id,
      request,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.SubmodelElementAdded,
        payload: SubmodelActivityPayload.create({
          submodelId: submodel1.id,
          changes: [
            SubmodelElementAdded.create({
              path: IdShortPath.fromSegments([submodel1.idShort, "dataField1"]),
              submodelElement: Property.fromPlain(propertyPlain),
            }),
          ],
        }),
      },
    ]);
  });

  it("should add column", async () => {
    const {
      correlationId,
      digitalProductDocumentId,
      listIdShortPath,
      environment,
      admin,
      submodel1,
      row1,
    } = await createEnvironmentWithList();
    const body = SubmodelElementSchema.parse({
      modelType: KeyTypes.Property,
      idShort: "column1",
      valueType: DataTypeDef.String,
      value: "test",
    });
    const request = SubmodelElementRequest.create({
      body,
      version: ApiVersionsDto.v2,
    });
    const position = 1;

    await environmentService.addColumn(
      correlationId,
      digitalProductDocumentId,
      environment,
      submodel1.id,
      listIdShortPath,
      request,
      admin,
      position,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.ColumnAdded,
        payload: SubmodelActivityPayload.create({
          submodelId: submodel1.id,
          changes: [
            ColumnAdded.create({
              path: IdShortPath.fromSegments([submodel1.idShort, "list", row1.idShort, "column1"]),
              value: Property.fromPlain(body),
              position,
            }),
          ],
        }),
      },
    ]);
  });

  it("should add row", async () => {
    const {
      correlationId,
      digitalProductDocumentId,
      listIdShortPath,
      environment,
      admin,
      submodel1,
    } = await createEnvironmentWithList();
    const position = 3;

    const changedList = await environmentService.addRow(
      correlationId,
      digitalProductDocumentId,
      environment,
      submodel1.id,
      listIdShortPath,
      admin,
      position,
      latestVersion,
    );
    const row2IdShort = changedList.value[1].idShort;

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.RowAdded,
        payload: SubmodelActivityPayload.create({
          submodelId: submodel1.id,
          changes: [
            RowAdded.create({
              path: IdShortPath.fromSegments([submodel1.idShort, "list", row2IdShort]),
              position,
              value: SubmodelElementCollection.fromPlain({
                category: null,
                description: [],
                displayName: [],
                embeddedDataSpecifications: [],
                extensions: [],
                idShort: row2IdShort,
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
              }),
            }),
          ],
        }),
      },
    ]);
  });

  it("should return submodels for subject", async () => {
    const { environment, admin, member, submodel1 } = await createDefaultEnvironment();
    const pagination = Pagination.create({ limit: 10 });
    let submodels = await environmentService.getSubmodels(
      environment,
      pagination,
      admin.subject,
      latestVersion,
    );
    expect(submodels.result).toEqual([SubmodelJsonSchema.parse(submodel1.toPlain())]);

    submodels = await environmentService.getSubmodels(
      environment,
      pagination,
      member.subject,
      latestVersion,
    );
    expect(submodels.result).toEqual([]);
  });

  it("should return submodel by id for subject", async () => {
    const { environment, admin, submodel1 } = await createDefaultEnvironment();

    const result = await environmentService.getSubmodelById(
      environment,
      submodel1.id,
      admin.subject,
      latestVersion,
    );
    expect(result).toEqual(SubmodelJsonSchema.parse(submodel1.toPlain()));

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    await expect(
      environmentService.getSubmodelById(environment, submodel1.id, anonymous, latestVersion),
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
      latestVersion,
    );
    expect(submodelElements.result).toEqual([
      SubmodelElementSchema.parse(submodelElementCollection1.toPlain()),
    ]);

    submodelElements = await environmentService.getSubmodelElements(
      environment,
      submodel1.id,
      pagination,
      member.subject,
      latestVersion,
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
      latestVersion,
    );
    expect(submodelElement).toEqual(SubmodelElementSchema.parse(property1.toPlain()));
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    await expect(
      environmentService.getSubmodelElementById(
        environment,
        submodel1.id,
        idShortPath,
        anonymous,
        latestVersion,
      ),
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
      latestVersion,
    );
    expect(submodelElement).toEqual(property1.value);

    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    //
    await expect(
      environmentService.getSubmodelElementValue(
        environment,
        submodel1.id,
        idShortPath,
        anonymous,
        latestVersion,
      ),
    ).rejects.toThrow(new ForbiddenError());
  });

  it("should return value representation of submodel value ", async () => {
    const { environment, admin, submodel1, property1, property2 } =
      await createDefaultEnvironment();
    const submodelValue = await environmentService.getSubmodelValue(
      environment,
      submodel1.id,
      admin.subject,
      latestVersion,
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
      environmentService.getSubmodelValue(environment, submodel1.id, anonymous, latestVersion),
    ).rejects.toThrow(new ForbiddenError("Cannot access submodel section1"));
  });

  it("should modify submodel", async () => {
    const { correlationId, digitalProductDocumentId, environment, admin, member, submodel1 } =
      await createDefaultEnvironment();
    const oldDisplayName = submodel1.displayName;
    const modification = {
      idShort: submodel1.idShort,
      displayName: [LanguageText.create({ text: "Test", language: "en-US" })],
    };
    const modificationRequest = SubmodelModificationRequest.create({
      body: modification,
      version: ApiVersionsDto.v2,
    });
    await environmentService.modifySubmodel(
      correlationId,
      digitalProductDocumentId,
      environment,
      submodel1.id,
      modificationRequest,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);

    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.SubmodelModified,
        payload: SubmodelActivityPayload.create({
          submodelId: submodel1.id,
          changes: [
            DisplayNameChanged.create({
              path: IdShortPath.fromSegments([submodel1.idShort]),
              oldValue: oldDisplayName,
              newValue: modification.displayName,
            }),
          ],
        }),
      },
    ]);

    //
    await expect(
      environmentService.modifySubmodel(
        correlationId,
        digitalProductDocumentId,
        environment,
        submodel1.id,
        modificationRequest,
        member,
      ),
    ).rejects.toThrow(new ForbiddenError("Missing permissions to modify element section1."));
  });

  it("should modify submodel value", async () => {
    const {
      correlationId,
      digitalProductDocumentId,
      environment,
      admin,
      member,
      submodel1,
      property1,
    } = await createDefaultEnvironment();
    const oldValue = property1.value;
    const modification = {
      subSection1: {
        property1: "Test",
      },
    };
    const modificationRequest = ValueModificationRequest.create({
      body: modification,
      version: latestVersion,
    });

    await environmentService.modifyValueOfSubmodel(
      correlationId,
      digitalProductDocumentId,
      environment,
      submodel1.id,
      modificationRequest,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);

    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.SubmodelValueModified,
        payload: SubmodelActivityPayload.create({
          submodelId: submodel1.id,
          changes: [
            PropertyValueChanged.create({
              path: IdShortPath.fromSegments([submodel1.idShort, "subSection1", "property1"]),
              oldValue,
              newValue: "Test",
              valueType: DataTypeDef.String,
            }),
          ],
        }),
      },
    ]);

    await expect(
      environmentService.modifyValueOfSubmodel(
        correlationId,
        digitalProductDocumentId,
        environment,
        submodel1.id,
        modificationRequest,
        member,
      ),
    ).rejects.toThrow(
      new ForbiddenError("Missing permissions to modify element section1.subSection1.property1."),
    );
  });

  it("should modify submodel element", async () => {
    const {
      correlationId,
      digitalProductDocumentId,
      environment,
      admin,
      member,
      submodel1,
      submodelElementCollection1,
      property1,
    } = await createDefaultEnvironment();
    const oldDisplayName = property1.displayName;
    const modification = {
      idShort: property1.idShort,
      displayName: [LanguageText.create({ text: "Test", language: "en-US" })],
    };
    const modificationRequest = SubmodelElementModificationRequest.create({
      body: modification,
      version: latestVersion,
    });
    const idShortPathToProperty1 = IdShortPath.create({
      path: `${submodelElementCollection1.idShort}.${property1.idShort}`,
    });
    await environmentService.modifySubmodelElement(
      correlationId,
      digitalProductDocumentId,
      environment,
      submodel1.id,
      modificationRequest,
      idShortPathToProperty1,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.SubmodelElementModified,
        payload: SubmodelActivityPayload.create({
          submodelId: submodel1.id,
          changes: [
            DisplayNameChanged.create({
              path: IdShortPath.fromSegments([submodel1.idShort, "subSection1", "property1"]),
              oldValue: oldDisplayName,
              newValue: modification.displayName,
            }),
          ],
        }),
      },
    ]);
    //
    await expect(
      environmentService.modifySubmodelElement(
        correlationId,
        digitalProductDocumentId,
        environment,
        submodel1.id,
        modificationRequest,
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
    const correlationId = randomUUID();
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
    submodel1.addSubmodelElement(submodelElementList, { ability });

    const listIdShortPath = IdShortPath.create({ path: submodelElementList.idShort });
    const col1 = Property.create({ idShort: "col1", value: "10", valueType: DataTypeDef.Double });
    submodel1.addColumn(listIdShortPath, col1, { ability });

    await submodelRepository.save(submodel1);
    const assetAdministrationShell = AssetAdministrationShell.create({ security });
    assetAdministrationShell.addSubmodel(submodel1);
    await aasRepository.save(assetAdministrationShell);
    const row1 = submodelElementList.getSubmodelElements()[0];
    const environment = Environment.create({
      assetAdministrationShells: [assetAdministrationShell.id],
      submodels: [submodel1.id],
    });
    return {
      correlationId,
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
      correlationId,
      digitalProductDocumentId,
      environment,
      admin,
      member,
      submodel1,
      row1,
      col1,
      listIdShortPath,
    } = await createEnvironmentWithList();
    const oldDisplayName = col1.displayName;
    const modification = {
      idShort: col1.idShort,
      displayName: [LanguageText.create({ text: "Test", language: "en-US" })],
    };
    const modificationRequest = SubmodelElementModificationRequest.create({
      body: modification,
      version: latestVersion,
    });
    await environmentService.modifyColumn(
      correlationId,
      digitalProductDocumentId,
      environment,
      submodel1.id,
      listIdShortPath,
      col1.idShort,
      modificationRequest,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.ColumnModified,
        payload: SubmodelActivityPayload.create({
          submodelId: submodel1.id,
          changes: [
            DisplayNameChanged.create({
              path: IdShortPath.fromSegments([submodel1.idShort, "list", row1.idShort, "col1"]),
              oldValue: oldDisplayName,
              newValue: modification.displayName,
            }),
          ],
        }),
      },
    ]);

    //
    await expect(
      environmentService.modifyColumn(
        correlationId,
        digitalProductDocumentId,
        environment,
        submodel1.id,
        listIdShortPath,
        col1.idShort,
        modificationRequest,
        member,
      ),
    ).rejects.toThrow(
      new ForbiddenError(
        `Missing permissions to modify element section1.list.${row1.idShort}.col1.`,
      ),
    );
  });

  it("should delete column", async () => {
    const {
      digitalProductDocumentId,
      correlationId,
      environment,
      admin,
      member,
      submodel1,
      row1,
      col1,
      listIdShortPath,
    } = await createEnvironmentWithList();
    await expect(
      environmentService.deleteColumn(
        correlationId,
        digitalProductDocumentId,
        environment,
        submodel1.id,
        listIdShortPath,
        col1.idShort,
        member,
        latestVersion,
      ),
    ).rejects.toThrow(
      new ForbiddenError(
        `Missing permissions to delete element section1.list.${row1.idShort}.col1.`,
      ),
    );

    const list: any = await environmentService.deleteColumn(
      correlationId,
      digitalProductDocumentId,
      environment,
      submodel1.id,
      listIdShortPath,
      col1.idShort,
      admin,
      latestVersion,
    );

    expect(list.value[0].value.map((e: any) => e.idShort)).not.toContain(col1.idShort);

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.ColumnDeleted,
        payload: SubmodelWithAasActivityPayload.create({
          submodelId: submodel1.id,
          aasId: environment.assetAdministrationShells[0],
          changes: [
            ColumnDeleted.create({
              path: IdShortPath.fromSegments([submodel1.idShort, "list", row1.idShort, "col1"]),
              value: col1,
              position: 0,
            }),
          ],
        }),
      },
    ]);
  });

  it("should delete row", async () => {
    const {
      digitalProductDocumentId,
      correlationId,
      environment,
      admin,
      member,
      submodel1,
      row1,
      listIdShortPath,
    } = await createEnvironmentWithList();

    await expect(
      environmentService.deleteRow(
        correlationId,
        digitalProductDocumentId,
        environment,
        submodel1.id,
        listIdShortPath,
        row1.idShort,
        member,
        latestVersion,
      ),
    ).rejects.toThrow(
      new ForbiddenError(`Missing permissions to delete element section1.list.${row1.idShort}.`),
    );

    const list: any = await environmentService.deleteRow(
      correlationId,
      digitalProductDocumentId,
      environment,
      submodel1.id,
      listIdShortPath,
      row1.idShort,
      admin,
      latestVersion,
    );

    expect(list.value.map((e: any) => e.idShort)).not.toContain(row1.idShort);
    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);
    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.RowDeleted,
        payload: SubmodelWithAasActivityPayload.create({
          submodelId: submodel1.id,
          aasId: environment.assetAdministrationShells[0],
          changes: [
            RowDeleted.create({
              path: IdShortPath.fromSegments([submodel1.idShort, "list", row1.idShort]),
              position: 0,
              value: SubmodelElementCollection.fromPlain(row1.toPlain()),
            }),
          ],
        }),
      },
    ]);
  });

  it("should modify value of submodel element", async () => {
    const {
      correlationId,
      digitalProductDocumentId,
      environment,
      admin,
      member,
      submodel1,
      submodelElementCollection1,
      property1,
      property2,
    } = await createDefaultEnvironment();
    const oldValue1 = property1.value;
    const oldValue2 = property2.value;
    const modification = { [property1.idShort]: "new value 1", [property2.idShort]: "new value 2" };
    const modificationRequest = ValueModificationRequest.create({
      body: modification,
      version: latestVersion,
    });
    const idShortPathToProperty1 = IdShortPath.create({
      path: `${submodelElementCollection1.idShort}`,
    });
    await environmentService.modifyValueOfSubmodelElement(
      correlationId,
      digitalProductDocumentId,
      environment,
      submodel1.id,
      modificationRequest,
      idShortPathToProperty1,
      admin,
    );

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);

    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.SubmodelElementValueModified,
        payload: SubmodelActivityPayload.create({
          submodelId: submodel1.id,
          changes: [
            PropertyValueChanged.create({
              path: IdShortPath.fromSegments([
                submodel1.idShort,
                submodelElementCollection1.idShort,
                property1.idShort,
              ]),
              oldValue: oldValue1,
              newValue: "new value 1",
              valueType: DataTypeDef.String,
            }),
            PropertyValueChanged.create({
              path: IdShortPath.fromSegments([
                submodel1.idShort,
                submodelElementCollection1.idShort,
                property2.idShort,
              ]),
              oldValue: oldValue2,
              newValue: "new value 2",
              valueType: DataTypeDef.String,
            }),
          ],
        }),
      },
    ]);

    //
    await expect(
      environmentService.modifyValueOfSubmodelElement(
        correlationId,
        digitalProductDocumentId,
        environment,
        submodel1.id,
        modificationRequest,
        idShortPathToProperty1,
        member,
      ),
    ).rejects.toThrow(
      new ForbiddenError("Missing permissions to modify element section1.subSection1.property1."),
    );
  });

  it("should delete policy", async () => {
    const { correlationId, digitalProductDocumentId, environment, admin, member, submodel1 } =
      await createDefaultEnvironment();
    let foundAas = await aasRepository.findOneOrFail(environment.assetAdministrationShells[0]);
    expect(foundAas.security.findPoliciesBySubject(member.subject)).not.toEqual([]);

    await environmentService.deletePolicyBySubjectAndObject(
      correlationId,
      digitalProductDocumentId,
      environment,
      IdShortPath.create({ path: submodel1.idShort }),
      member.subject,
      admin,
    );
    foundAas = await aasRepository.findOneOrFail(environment.assetAdministrationShells[0]);
    expect(foundAas.security.findPoliciesBySubject(member.subject)).toEqual([]);

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);

    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.PolicyDeleted,
        payload: AssetAdministrationShellActivityPayload.create({
          aasId: environment.assetAdministrationShells[0],
          changes: [
            PolicyDeleted.create({
              object: createAasObject(IdShortPath.fromSegments([submodel1.idShort])),
              userRole: UserRole.USER,
              memberRole: MemberRole.MEMBER,
            }),
          ],
        }),
      },
    ]);
  });

  it("should delete submodel from environment", async () => {
    const { correlationId, digitalProductDocumentId, environment, admin, member, submodel1 } =
      await createDefaultEnvironment();
    const saveEnvironmentMock = jest.fn<() => Promise<void>>();

    await expect(
      environmentService.deleteSubmodelFromEnvironment(
        correlationId,
        digitalProductDocumentId,
        environment,
        submodel1.id,
        saveEnvironmentMock,
        member,
      ),
    ).rejects.toThrow(
      new ForbiddenError(`Missing permissions to delete element ${submodel1.idShort}.`),
    );

    await environmentService.deleteSubmodelFromEnvironment(
      correlationId,
      digitalProductDocumentId,
      environment,
      submodel1.id,
      saveEnvironmentMock,
      admin,
    );
    expect(environment.submodels).not.toContain(submodel1.id);

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);

    const submodelObject = createAasObject(IdShortPath.fromSegments([submodel1.idShort]));

    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.SubmodelDeleted,
        payload: SubmodelWithAasActivityPayload.create({
          submodelId: submodel1.id,
          aasId: environment.assetAdministrationShells[0],
          changes: [
            SubmodelReferenceDeleted.create({
              submodelRef: submodelToReference(submodel1),
            }),
            PolicyDeleted.create({
              object: submodelObject,
              userRole: UserRole.ADMIN,
            }),
            PolicyDeleted.create({
              object: submodelObject,
              userRole: UserRole.USER,
              memberRole: MemberRole.MEMBER,
            }),
            DeletedSubmodelFromEnv.create({
              position: 0,
              submodel: submodel1,
            }),
            SubmodelDeleted.create({
              submodel: Submodel.fromPlain({
                ...submodel1.toPlain(),
                administration: { version: "2", revision: "0" },
              }),
            }),
          ],
        }),
      },
      // {
      //   correlationId,
      //   type: ActivityOldTypes.SubmodelRepositoryActivity,
      //   payload: SubmodelRepositoryPayload.create({
      //     command: {
      //       op: SubmodelRepositoryOperationTypes.SubmodelDeleted,
      //     },
      //     submodel: submodel1,
      //   }),
      // },
    ]);
    //
  });

  it("should delete submodel element", async () => {
    const {
      correlationId,
      digitalProductDocumentId,
      environment,
      admin,
      member,
      submodel1,
      submodelElementCollection1,
      property1,
    } = await createDefaultEnvironment();
    const idShortPath = IdShortPath.create({
      path: `${submodelElementCollection1.idShort}.${property1.idShort}`,
    });

    await expect(
      environmentService.deleteSubmodelElement(
        correlationId,
        digitalProductDocumentId,
        environment,
        submodel1.id,
        idShortPath,
        member,
      ),
    ).rejects.toThrow(
      new ForbiddenError(
        `Missing permissions to delete element ${submodel1.idShort}.${idShortPath.toString()}.`,
      ),
    );

    await environmentService.deleteSubmodelElement(
      correlationId,
      digitalProductDocumentId,
      environment,
      submodel1.id,
      idShortPath,
      admin,
    );
    const foundSubmodel = await submodelRepository.findOneOrFail(submodel1.id);
    expect(foundSubmodel.findSubmodelElement(idShortPath)).toBeUndefined();

    const foundActivities = await activityRepository.findByAggregateId(digitalProductDocumentId);

    expect(
      foundActivities.items.map((e) => ({
        correlationId: e.header.correlationId,
        type: e.header.type,
        payload: e.payload,
      })),
    ).toEqual([
      {
        correlationId,
        type: ActivityTypes.SubmodelElementDeleted,
        payload: SubmodelWithAasActivityPayload.create({
          submodelId: submodel1.id,
          aasId: environment.assetAdministrationShells[0],
          changes: [
            SubmodelElementDeleted.create({
              path: IdShortPath.fromSegments([
                submodel1.idShort,
                submodelElementCollection1.idShort,
                property1.idShort,
              ]),
              submodelElement: Property.fromPlain(property1.toPlain()),
            }),
          ],
        }),
      },
    ]);
    //
  });

  describe("extraCleanup / atomic stale-config cleanup", () => {
    describe("deleteSubmodelElement", () => {
      it("invokes extraCleanup exactly once with the submodel-prefixed element path and the active transaction session", async () => {
        const {
          digitalProductDocumentId,
          correlationId,
          environment,
          admin,
          submodel1,
          submodelElementCollection1,
          property1,
        } = await createDefaultEnvironment();
        const idShortPath = IdShortPath.create({
          path: `${submodelElementCollection1.idShort}.${property1.idShort}`,
        });

        let capturedSession: ClientSession | undefined;
        const extraCleanup = jest
          .fn<(idShortPathString: string, options: { session?: ClientSession }) => Promise<void>>()
          .mockImplementation(async (_idShortPathString, options) => {
            capturedSession = options.session;
          });

        await environmentService.deleteSubmodelElement(
          correlationId,
          digitalProductDocumentId,
          environment,
          submodel1.id,
          idShortPath,
          admin,
          extraCleanup,
        );

        expect(extraCleanup).toHaveBeenCalledTimes(1);
        const [pathArg, optionsArg] = extraCleanup.mock.calls[0];
        expect(pathArg).toBe(`${submodel1.idShort}.${idShortPath.toString()}`);
        expect(optionsArg.session).toBeTruthy();
        // The session handed to the cleanup must be a live Mongo ClientSession that
        // participated in the surrounding transaction.
        expect(capturedSession).toBeDefined();
        expect(typeof capturedSession!.endSession).toBe("function");
      });

      it("rolls back the element deletion when extraCleanup throws", async () => {
        const {
          digitalProductDocumentId,
          correlationId,
          environment,
          admin,
          submodel1,
          submodelElementCollection1,
          property1,
        } = await createDefaultEnvironment();
        const idShortPath = IdShortPath.create({
          path: `${submodelElementCollection1.idShort}.${property1.idShort}`,
        });

        const extraCleanup = jest
          .fn<(idShortPathString: string, options: { session?: ClientSession }) => Promise<void>>()
          .mockRejectedValue(new Error("cleanup boom"));

        await expect(
          environmentService.deleteSubmodelElement(
            correlationId,
            digitalProductDocumentId,
            environment,
            submodel1.id,
            idShortPath,
            admin,
            extraCleanup,
          ),
        ).rejects.toThrow("cleanup boom");

        // The element delete and the cleanup share one transaction; aborting the
        // cleanup must abort the delete, so the element is still present in the DB.
        const foundSubmodel = await submodelRepository.findOneOrFail(submodel1.id);
        expect(foundSubmodel.findSubmodelElement(idShortPath)).toBeDefined();
      });

      it("rolls back the cleanup's own writes performed through the shared session", async () => {
        const {
          environment,
          digitalProductDocumentId,
          correlationId,
          admin,
          submodel1,
          submodelElementCollection1,
          property1,
        } = await createDefaultEnvironment();
        const idShortPath = IdShortPath.create({
          path: `${submodelElementCollection1.idShort}.${property1.idShort}`,
        });
        const conceptDescriptionId = randomUUID();

        const extraCleanup = jest
          .fn<(idShortPathString: string, options: { session?: ClientSession }) => Promise<void>>()
          .mockImplementation(async (_idShortPathString, options) => {
            // Perform a real write on the shared session, then fail the transaction.
            await conceptDescriptionRepository.save(
              ConceptDescription.create({ id: conceptDescriptionId }),
              options,
            );
            throw new Error("cleanup boom after write");
          });

        await expect(
          environmentService.deleteSubmodelElement(
            correlationId,
            digitalProductDocumentId,
            environment,
            submodel1.id,
            idShortPath,
            admin,
            extraCleanup,
          ),
        ).rejects.toThrow("cleanup boom after write");

        // The write issued by the cleanup on the shared session must roll back too.
        expect(await conceptDescriptionRepository.findOne(conceptDescriptionId)).toBeUndefined();
      });
    });

    describe("deleteSubmodelFromEnvironment", () => {
      it("invokes extraCleanup exactly once with the submodel idShort and the active transaction session", async () => {
        const { environment, admin, submodel1, correlationId, digitalProductDocumentId } =
          await createDefaultEnvironment();
        const saveEnvironmentMock = jest.fn<() => Promise<void>>();

        let capturedSession: ClientSession | undefined;
        const extraCleanup = jest
          .fn<(submodelIdShort: string, options: { session?: ClientSession }) => Promise<void>>()
          .mockImplementation(async (_submodelIdShort, options) => {
            capturedSession = options.session;
          });

        await environmentService.deleteSubmodelFromEnvironment(
          correlationId,
          digitalProductDocumentId,
          environment,
          submodel1.id,
          saveEnvironmentMock,
          admin,
          extraCleanup,
        );

        expect(extraCleanup).toHaveBeenCalledTimes(1);
        const [idShortArg, optionsArg] = extraCleanup.mock.calls[0];
        expect(idShortArg).toBe(submodel1.idShort);
        expect(optionsArg.session).toBeTruthy();
        expect(capturedSession).toBeDefined();
        expect(typeof capturedSession!.endSession).toBe("function");
      });

      it("rolls back the submodel deletion when extraCleanup throws", async () => {
        const { environment, admin, submodel1, digitalProductDocumentId, correlationId } =
          await createDefaultEnvironment();
        const saveEnvironmentMock = jest.fn<() => Promise<void>>();

        const extraCleanup = jest
          .fn<(submodelIdShort: string, options: { session?: ClientSession }) => Promise<void>>()
          .mockRejectedValue(new Error("submodel cleanup boom"));

        await expect(
          environmentService.deleteSubmodelFromEnvironment(
            correlationId,
            digitalProductDocumentId,
            environment,
            submodel1.id,
            saveEnvironmentMock,
            admin,
            extraCleanup,
          ),
        ).rejects.toThrow("submodel cleanup boom");

        // The submodel delete and the cleanup share one transaction; the abort must
        // leave the submodel persisted.
        expect(await submodelRepository.findOne(submodel1.id)).toBeDefined();
      });
    });
  });

  it("should delete all resources of environment", async () => {
    const { environment: defaultEnvironment } = await createDefaultEnvironment();
    const conceptDescription = ConceptDescription.create({ id: randomUUID() });
    await conceptDescriptionRepository.save(conceptDescription);
    const environment = Environment.create({
      assetAdministrationShells: defaultEnvironment.assetAdministrationShells,
      submodels: defaultEnvironment.submodels,
      conceptDescriptions: [conceptDescription.id],
    });
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
    expect(environment.conceptDescriptions.length).toBeGreaterThan(0);
    for (const conceptDescriptionId of environment.conceptDescriptions) {
      expect(await conceptDescriptionRepository.findOne(conceptDescriptionId)).toBeUndefined();
    }
  });

  afterAll(async () => {
    await module.close();
  });
});
