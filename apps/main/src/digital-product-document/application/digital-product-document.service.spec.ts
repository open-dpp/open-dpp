import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { EnvModule, EnvService } from "@open-dpp/env";
import { AasModule } from "../../aas/aas.module";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../../aas/infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "../../aas/infrastructure/schemas/submodel.schema";
import { generateMongoConfig } from "../../database/config";
import { OrganizationsModule } from "../../identity/organizations/organizations.module";
import { UsersModule } from "../../identity/users/users.module";
import { UniqueProductIdentifierRepository } from "../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../passports/infrastructure/passport.schema";
import { Passport } from "../../passports/domain/passport";
import { Environment } from "../../aas/domain/environment";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
} from "../domain/digital-product-document-status";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { randomUUID } from "node:crypto";
import { type Mock, afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ValueError } from "@open-dpp/exception";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { DigitalProductDocumentService } from "./digital-product-document.service";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { ConceptDescriptionRepository } from "../../aas/infrastructure/concept-description.repository";
import {
  ConceptDescriptionDoc,
  ConceptDescriptionSchema,
} from "../../aas/infrastructure/schemas/concept-description.schema";
import { ApiVersionsDto, DataTypeDef, KeyTypes, PermissionKind, Permissions } from "@open-dpp/dto";
import { ActivityRepository } from "../../activity-history/infrastructure/activity.repository";

import { Response } from "express";
import { Archiver } from "archiver";
import { ActivityHistoryModule } from "../../activity-history/activity-history.module";
import { AssetAdministrationShell } from "../../aas/domain/asset-adminstration-shell";
import { AasRepository } from "../../aas/infrastructure/aas.repository";
import { Security } from "../../aas/domain/security/security";
import { Permission } from "../../aas/domain/security/permission";
import { SubmodelElementModifiedActivity } from "../../activity-history/domain/activities/submodel-element-modified.activity";
import { ChangeTracker } from "../../activity-history/domain/change-tracker";
import { PropertyValueChanged } from "../../activity-history/domain/change-events/property-value-changed";
import { Submodel } from "../../aas/domain/submodel-base/submodel";
import { PresentationConfigurationService } from "../../presentation-configurations/application/services/presentation-configuration.service";
import { PresentationConfigurationsModule } from "../../presentation-configurations/presentation-configurations.module";
import { TransactionService } from "../../database/transaction.service";
import { EmailService } from "../../email/email.service";
import { Template } from "../../templates/domain/template";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import { TemplateDoc, TemplateSchema } from "../../templates/infrastructure/template.schema";
import { SubmodelRepository } from "../../aas/infrastructure/submodel.repository";
import { SubmodelElementList } from "../../aas/domain/submodel-base/submodel-element-list";
import { Property } from "../../aas/domain/submodel-base/property";
import { EditingMode } from "../domain/editing-mode";
import {
  AasSubmodelElements,
  DigitalProductDocumentTypes,
  PresentationComponentName,
} from "@open-dpp/dto";

describe("DigitalProductDocumentService", () => {
  let service: DigitalProductDocumentService<Passport>;
  let module: TestingModule;
  let passportRepository: PassportRepository;
  let activityRepository: ActivityRepository;
  let assetAdministrationShellRepository: AasRepository;
  let templateRepository: TemplateRepository;
  let templateService: DigitalProductDocumentService<Template>;
  let submodelRepository: SubmodelRepository;
  let presentationConfigurationService: PresentationConfigurationService;
  const latestVersion = ApiVersionsDto.v2;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        EventEmitterModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          { name: PassportDoc.name, schema: PassportSchema },
          { name: TemplateDoc.name, schema: TemplateSchema },
          { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
          { name: SubmodelDoc.name, schema: SubmodelSchema },
          { name: UniqueProductIdentifierDoc.name, schema: UniqueProductIdentifierSchema },
          { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
        ]),
        ActivityHistoryModule,
        AasModule,
        UsersModule,
        OrganizationsModule,
        PresentationConfigurationsModule,
      ],
      providers: [
        TransactionService,
        EnvironmentService,
        PassportRepository,
        TemplateRepository,
        UniqueProductIdentifierRepository,
        ConceptDescriptionRepository,
        PresentationConfigurationService,
      ],
    })
      .overrideProvider(EmailService)
      .useValue({
        send: vi.fn(),
      })
      .compile();
    await module.init();
    passportRepository = module.get<PassportRepository>(PassportRepository);
    const environmentService = module.get<EnvironmentService>(EnvironmentService);
    presentationConfigurationService = module.get<PresentationConfigurationService>(
      PresentationConfigurationService,
    );
    activityRepository = module.get<ActivityRepository>(ActivityRepository);
    assetAdministrationShellRepository = module.get<AasRepository>(AasRepository);

    service = new DigitalProductDocumentService(
      environmentService,
      passportRepository,
      activityRepository,
      presentationConfigurationService,
    );
    templateRepository = module.get<TemplateRepository>(TemplateRepository);
    submodelRepository = module.get<SubmodelRepository>(SubmodelRepository);
    templateService = new DigitalProductDocumentService(
      environmentService,
      templateRepository,
      activityRepository,
      presentationConfigurationService,
    );
  });

  it("should fail on modifications of archived passports", async () => {
    const correlationId = randomUUID();
    const userId = randomUUID();
    const passport = Passport.create({
      organizationId: "organizationId",
      environment: Environment.create({}),
      lastStatusChange: DigitalProductDocumentStatusChange.create({
        previousStatus: DigitalProductDocumentStatus.Draft,
        currentStatus: DigitalProductDocumentStatus.Archived,
      }),
    });
    const subject = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const userContext = { subject, userId };
    await passportRepository.save(passport);
    const exception = new ValueError("Cannot modify an archived digital product document");
    await expect(
      service.modifyShell(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        {},
        userContext,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.modifySubmodel(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        { idShort: "demo" },
        userContext,
        latestVersion,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.modifyColumnOfSubmodelElementList(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "demolist" }),
        "col1",
        { idShort: "col1" },
        userContext,
        latestVersion,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.modifySubmodelElement(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "col1" }),
        { idShort: "col1" },
        userContext,
        latestVersion,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.modifySubmodelElementValue(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "col1" }),
        {},
        userContext,
        latestVersion,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.deleteSubmodel(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        userContext,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.deleteSubmodelElement(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "sub1" }),
        userContext,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.deleteColumnFromSubmodelElementList(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "demolist" }),
        "col1",
        userContext,
        latestVersion,
      ),
    ).rejects.toThrow(exception);
    await expect(
      service.deleteRowFromSubmodelElementList(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "demolist" }),
        "row1",
        userContext,
        latestVersion,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.deletePolicyBySubjectAndObject(
        correlationId,
        passport.organizationId,
        passport.id,
        {
          subject: SubjectAttributes.create({
            userRole: UserRole.ADMIN,
            memberRole: MemberRole.MEMBER,
          }),
          object: "policy1",
        },
        userContext,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.createSubmodel(
        correlationId,
        passport.organizationId,
        passport.id,
        { idShort: "sub" },
        userContext,
        latestVersion,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.addColumnToSubmodelElementList(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "sub" }),
        {
          idShort: "col1",
          modelType: KeyTypes.Property,
          description: [],
          displayName: [],
          embeddedDataSpecifications: [],
          supplementalSemanticIds: [],
          qualifiers: [],
        },
        undefined,
        userContext,
        latestVersion,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.createGroupFromColumnInSubmodelElementList(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "sub" }),
        "col1",
        {
          idShort: "group1",
          modelType: KeyTypes.SubmodelElementCollection,
          description: [],
          displayName: [],
          embeddedDataSpecifications: [],
          supplementalSemanticIds: [],
          qualifiers: [],
        },
        userContext,
        latestVersion,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.addRowToSubmodelElementList(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "sub" }),
        undefined,
        userContext,
        latestVersion,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.createSubmodelElement(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        {
          idShort: "prop1",
          modelType: KeyTypes.Property,
          description: [],
          displayName: [],
          embeddedDataSpecifications: [],
          supplementalSemanticIds: [],
          qualifiers: [],
        },
        userContext,
        latestVersion,
      ),
    ).rejects.toThrow(exception);
    await expect(
      service.createSubmodelElementAtIdShortPath(
        correlationId,
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "sub" }),
        {
          idShort: "prop1",
          modelType: KeyTypes.Property,
          description: [],
          displayName: [],
          embeddedDataSpecifications: [],
          supplementalSemanticIds: [],
          qualifiers: [],
        },
        userContext,
        latestVersion,
      ),
    ).rejects.toThrow(exception);
  });

  it("should download activities", async () => {
    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const date3 = new Date("2022-03-01T00:00:00.000Z");
    const date4 = new Date("2022-03-03T00:00:00.000Z");
    const organizationId = randomUUID();
    const submodelIdShort = "submodelIdShort";

    const security = Security.create({});
    const admin = SubjectAttributes.create({
      userRole: UserRole.ADMIN,
      memberRole: MemberRole.MEMBER,
    });
    security.addPolicy(admin, IdShortPath.create({ path: submodelIdShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);

    const assetAdministrationShell = AssetAdministrationShell.create({ security });
    await assetAdministrationShellRepository.save(assetAdministrationShell);

    const passport = Passport.create({
      organizationId,
      environment: Environment.create({
        assetAdministrationShells: [assetAdministrationShell.id],
      }),
    });
    await passportRepository.save(passport);
    const submodel = Submodel.create({ idShort: submodelIdShort });
    const createActivity = (id: string, idShort: string, createdAt: Date) => {
      return SubmodelElementModifiedActivity.create({
        digitalProductDocumentId: id,
        submodel: submodel.withTracking(
          ChangeTracker.fromChanges([
            PropertyValueChanged.create({
              path: IdShortPath.fromSegments([submodelIdShort, idShort]),
              valueType: DataTypeDef.String,
              oldValue: "oldValue",
              newValue: "newValue",
            }),
          ]),
        ),
        createdAt,
        correlationId: randomUUID(),
      });
    };

    const event1 = createActivity(passport.id, "prop1", date1);

    const event2 = createActivity(passport.id, "prop2", date2);
    const event3 = createActivity(passport.id, "prop3", date3);

    const event4 = createActivity(passport.id, "prop4", date4);
    const activities = [event1, event2, event3, event4];
    await activityRepository.createMany(activities);
    const res = {
      set: vi.fn(),
    } as unknown as Response;

    const mockArchive = {
      pipe: vi.fn(),
      append: vi.fn(),
      finalize: vi.fn(),
    } as unknown as Archiver;

    await service.downloadActivitiesWithArchiver(
      res,
      organizationId,
      passport.id,
      admin,
      date1.toISOString(),
      date4.toISOString(),
      2,
      mockArchive,
    );

    const appendMock = mockArchive.append as Mock;

    let [arg1, arg2] = appendMock.mock.calls[0];
    expect(JSON.parse(arg1 as string)).toEqual([event1.toPlain(), event2.toPlain()]);
    expect(arg2).toEqual({
      name: `${date1.toISOString()}-${date2.toISOString()}.json`,
    });

    [arg1, arg2] = appendMock.mock.calls[1];
    expect(JSON.parse(arg1 as string)).toEqual([event3.toPlain(), event4.toPlain()]);
    expect(arg2).toEqual({
      name: `${date3.toISOString()}-${date4.toISOString()}.json`,
    });

    expect(res.set).toHaveBeenCalledWith({
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="activities.zip"',
    });
    expect(mockArchive.pipe).toHaveBeenCalledWith(res);
    expect(mockArchive.append).toHaveBeenCalledTimes(2);
    expect(mockArchive.finalize).toHaveBeenCalledTimes(1);
  });

  it("should get activities", async () => {
    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const date3 = new Date("2022-03-01T00:00:00.000Z");
    const date4 = new Date("2022-03-03T00:00:00.000Z");
    const organizationId = randomUUID();
    const submodelIdShort = "submodelIdShort";

    const security = Security.create({});
    const admin = SubjectAttributes.create({
      userRole: UserRole.ADMIN,
      memberRole: MemberRole.MEMBER,
    });
    const member = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    security.addPolicy(admin, IdShortPath.create({ path: submodelIdShort }), [
      Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow }),
    ]);

    const assetAdministrationShell = AssetAdministrationShell.create({ security });
    await assetAdministrationShellRepository.save(assetAdministrationShell);

    const passport = Passport.create({
      organizationId,
      environment: Environment.create({
        assetAdministrationShells: [assetAdministrationShell.id],
      }),
    });
    await passportRepository.save(passport);

    const submodel = Submodel.create({ idShort: submodelIdShort });
    const createActivity = (id: string, idShort: string, createdAt: Date) => {
      return SubmodelElementModifiedActivity.create({
        digitalProductDocumentId: id,
        submodel: submodel.withTracking(
          ChangeTracker.fromChanges([
            PropertyValueChanged.create({
              path: IdShortPath.fromSegments([submodelIdShort, idShort]),
              valueType: DataTypeDef.String,
              oldValue: "oldValue",
              newValue: "newValue",
            }),
          ]),
        ),
        createdAt,
        correlationId: randomUUID(),
      });
    };

    const event1 = createActivity(passport.id, "prop1", date1);

    const event2 = createActivity(passport.id, "prop2", date2);
    const event3 = createActivity(passport.id, "prop3", date3);

    const event4 = createActivity(passport.id, "prop4", date4);
    const activities = [event1, event2, event3, event4];
    await activityRepository.createMany(activities);

    const result = await service.getActivities(
      organizationId,
      passport.id,
      member,
      date1.toISOString(),
      date4.toISOString(),
      2,
      undefined,
      undefined,
      undefined,
    );
    result.result.forEach((e) => {
      expect(e.payload.changes).toEqual([]);
    });

    const resultForAdmin = await service.getActivities(
      organizationId,
      passport.id,
      admin,
      date1.toISOString(),
      date4.toISOString(),
      2,
      undefined,
      undefined,
      undefined,
    );
    resultForAdmin.result.every((e) => {
      expect(e.payload.changes).not.toEqual([]);
    });
  });

  describe("editing mode", () => {
    const lockedMessage = /restricted to data|read-only/;
    const userContext = {
      subject: SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
      userId: randomUUID(),
    };

    type Operation = (
      svc: DigitalProductDocumentService<any>,
      organizationId: string,
      id: string,
    ) => Promise<unknown>;

    const correlationId = randomUUID();
    const path = IdShortPath.create({ path: "list" });
    const elementBody: any = { idShort: "e", modelType: KeyTypes.Property };

    const structureOperations: Record<string, Operation> = {
      createSubmodel: (s, o, id) =>
        s.createSubmodel(correlationId, o, id, { idShort: "s" } as any, userContext, latestVersion),
      moveSubmodel: (s, o, id) =>
        s.moveSubmodel(
          correlationId,
          o,
          id,
          "sm",
          { position: 0 } as any,
          userContext,
          latestVersion,
        ),
      addColumnToSubmodelElementList: (s, o, id) =>
        s.addColumnToSubmodelElementList(
          correlationId,
          o,
          id,
          "sm",
          path,
          elementBody,
          undefined,
          userContext,
          latestVersion,
        ),
      createSubmodelElement: (s, o, id) =>
        s.createSubmodelElement(
          correlationId,
          o,
          id,
          "sm",
          elementBody,
          userContext,
          latestVersion,
        ),
      createSubmodelElementAtIdShortPath: (s, o, id) =>
        s.createSubmodelElementAtIdShortPath(
          correlationId,
          o,
          id,
          "sm",
          path,
          elementBody,
          userContext,
          latestVersion,
        ),
      moveSubmodelElement: (s, o, id) =>
        s.moveSubmodelElement(
          correlationId,
          o,
          id,
          "sm",
          path,
          { position: 0 } as any,
          userContext,
          latestVersion,
        ),
      modifyShell: (s, o, id) => s.modifyShell(correlationId, o, id, "aas", {}, userContext),
      modifySubmodel: (s, o, id) =>
        s.modifySubmodel(correlationId, o, id, "sm", { idShort: "s" }, userContext, latestVersion),
      modifyColumnOfSubmodelElementList: (s, o, id) =>
        s.modifyColumnOfSubmodelElementList(
          correlationId,
          o,
          id,
          "sm",
          path,
          "col",
          { idShort: "col" },
          userContext,
          latestVersion,
        ),
      reorderColumn: (s, o, id) =>
        s.reorderColumn(
          correlationId,
          o,
          id,
          "sm",
          path,
          "col",
          undefined,
          { position: 0 } as any,
          userContext,
          latestVersion,
        ),
      modifySubmodelElement: (s, o, id) =>
        s.modifySubmodelElement(
          correlationId,
          o,
          id,
          "sm",
          path,
          { idShort: "e" } as any,
          userContext,
          latestVersion,
        ),
      deleteSubmodel: (s, o, id) => s.deleteSubmodel(correlationId, o, id, "sm", userContext),
      deleteSubmodelElement: (s, o, id) =>
        s.deleteSubmodelElement(correlationId, o, id, "sm", path, userContext),
      deleteColumnFromSubmodelElementList: (s, o, id) =>
        s.deleteColumnFromSubmodelElementList(
          correlationId,
          o,
          id,
          "sm",
          path,
          "col",
          userContext,
          latestVersion,
        ),
      addColumnToGroupInSubmodelElementList: (s, o, id) =>
        s.addColumnToGroupInSubmodelElementList(
          correlationId,
          o,
          id,
          "sm",
          path,
          "group",
          elementBody,
          undefined,
          userContext,
          latestVersion,
        ),
      modifyColumnInGroupOfSubmodelElementList: (s, o, id) =>
        s.modifyColumnInGroupOfSubmodelElementList(
          correlationId,
          o,
          id,
          "sm",
          path,
          "group",
          "col",
          { idShort: "col" },
          userContext,
          latestVersion,
        ),
      deleteColumnFromGroupInSubmodelElementList: (s, o, id) =>
        s.deleteColumnFromGroupInSubmodelElementList(
          correlationId,
          o,
          id,
          "sm",
          path,
          "group",
          "col",
          userContext,
          latestVersion,
        ),
      moveColumnToGroupInSubmodelElementList: (s, o, id) =>
        s.moveColumnToGroupInSubmodelElementList(
          correlationId,
          o,
          id,
          "sm",
          path,
          "group",
          "col",
          userContext,
          latestVersion,
        ),
      createGroupFromColumnInSubmodelElementList: (s, o, id) =>
        s.createGroupFromColumnInSubmodelElementList(
          correlationId,
          o,
          id,
          "sm",
          path,
          "col",
          elementBody,
          userContext,
          latestVersion,
        ),
      deletePolicyBySubjectAndObject: (s, o, id) =>
        s.deletePolicyBySubjectAndObject(
          correlationId,
          o,
          id,
          { subject: userContext.subject, object: "policy" } as any,
          userContext,
        ),
    };

    const dataOperations: Record<string, Operation> = {
      modifyValueOfSubmodel: (s, o, id) =>
        s.modifyValueOfSubmodel(correlationId, o, id, "sm", {}, userContext, latestVersion),
      modifySubmodelElementValue: (s, o, id) =>
        s.modifySubmodelElementValue(
          correlationId,
          o,
          id,
          "sm",
          path,
          {},
          userContext,
          latestVersion,
        ),
      addRowToSubmodelElementList: (s, o, id) =>
        s.addRowToSubmodelElementList(
          correlationId,
          o,
          id,
          "sm",
          path,
          undefined,
          userContext,
          latestVersion,
        ),
      deleteRowFromSubmodelElementList: (s, o, id) =>
        s.deleteRowFromSubmodelElementList(
          correlationId,
          o,
          id,
          "sm",
          path,
          "row",
          userContext,
          latestVersion,
        ),
    };

    async function failureOf(operation: () => Promise<unknown>): Promise<Error> {
      try {
        await operation();
      } catch (error) {
        return error as Error;
      }
      throw new Error("expected the operation to fail");
    }

    async function createPublishedTemplate() {
      const template = Template.create({
        organizationId: randomUUID(),
        environment: Environment.create({}),
      });
      template.publish();
      await templateRepository.save(template);
      return template;
    }

    async function createDraftTemplate() {
      const template = Template.create({
        organizationId: randomUUID(),
        environment: Environment.create({}),
      });
      await templateRepository.save(template);
      return template;
    }

    async function createPassport(
      editingMode: typeof EditingMode.Full | typeof EditingMode.DataOnly,
    ) {
      const passport = Passport.create({
        organizationId: randomUUID(),
        environment: Environment.create({}),
        editingMode,
      });
      await passportRepository.save(passport);
      return passport;
    }

    describe.each(Object.entries({ ...structureOperations, ...dataOperations }))(
      "published template: %s",
      (_name, operation) => {
        it("is rejected because a published template is read-only", async () => {
          const template = await createPublishedTemplate();

          const error = await failureOf(
            async () => await operation(templateService, template.organizationId, template.id),
          );

          expect(error.message).toEqual(
            `Template ${template.id} is read-only; changes are not allowed`,
          );
        });
      },
    );

    describe.each(Object.entries(structureOperations))(
      "data-only passport: %s",
      (_name, operation) => {
        it("is rejected because structure is frozen", async () => {
          const passport = await createPassport(EditingMode.DataOnly);

          const error = await failureOf(
            async () => await operation(service, passport.organizationId, passport.id),
          );

          expect(error.message).toEqual(
            `Passport ${passport.id} editing is restricted to data; structural changes are not allowed`,
          );
        });
      },
    );

    describe.each(Object.entries(dataOperations))("data-only passport: %s", (_name, operation) => {
      it("passes the editing mode guard", async () => {
        const passport = await createPassport(EditingMode.DataOnly);

        const error = await failureOf(
          async () => await operation(service, passport.organizationId, passport.id),
        );

        expect(error.message).not.toMatch(lockedMessage);
      });
    });

    describe.each(Object.entries({ ...structureOperations, ...dataOperations }))(
      "draft template: %s",
      (_name, operation) => {
        it("passes the editing mode guard", async () => {
          const template = await createDraftTemplate();

          const error = await failureOf(
            async () => await operation(templateService, template.organizationId, template.id),
          );

          expect(error.message).not.toMatch(lockedMessage);
        });
      },
    );

    it("rejects edits of an archived template because it is read-only", async () => {
      const template = await createDraftTemplate();
      template.archive();
      await templateRepository.save(template);

      const error = await failureOf(
        async () =>
          await structureOperations.modifySubmodel(
            templateService,
            template.organizationId,
            template.id,
          ),
      );

      expect(error.message).toEqual(
        `Template ${template.id} is read-only; changes are not allowed`,
      );
    });

    describe("rows of a data-only passport", () => {
      const adminContext = {
        subject: SubjectAttributes.create({
          userRole: UserRole.ADMIN,
          memberRole: MemberRole.MEMBER,
        }),
        userId: randomUUID(),
      };

      async function createPassportWithTable(options: { withColumn: boolean }) {
        const security = Security.create({});
        security.addPolicy(adminContext.subject, IdShortPath.create({ path: "section1" }), [
          Permission.create({
            permission: Permissions.Read,
            kindOfPermission: PermissionKind.Allow,
          }),
          Permission.create({
            permission: Permissions.Edit,
            kindOfPermission: PermissionKind.Allow,
          }),
          Permission.create({
            permission: Permissions.Delete,
            kindOfPermission: PermissionKind.Allow,
          }),
          Permission.create({
            permission: Permissions.Create,
            kindOfPermission: PermissionKind.Allow,
          }),
        ]);
        const ability = security.defineAbilityForSubject(adminContext.subject, adminContext.userId);
        const submodel = Submodel.create({ idShort: "section1" });
        const list = SubmodelElementList.create({
          idShort: "list",
          typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
        });
        submodel.addSubmodelElement(list, { ability });
        const listPath = IdShortPath.create({ path: "list" });
        if (options.withColumn) {
          submodel.addColumn(
            listPath,
            Property.create({ idShort: "col1", value: "10", valueType: DataTypeDef.Double }),
            { ability },
          ); // the first column also creates the header row, the table's only row
        }
        await submodelRepository.save(submodel);
        const aas = AssetAdministrationShell.create({ security });
        aas.addSubmodel(submodel);
        await assetAdministrationShellRepository.save(aas);
        const passport = Passport.create({
          organizationId: randomUUID(),
          environment: Environment.create({
            assetAdministrationShells: [aas.id],
            submodels: [submodel.id],
          }),
          editingMode: EditingMode.DataOnly,
        });
        await passportRepository.save(passport);
        return { passport, submodel, listPath, aas };
      }

      it("can add and delete rows, keeping the last one, and clean up its presentation entry and policy", async () => {
        const { passport, submodel, listPath, aas } = await createPassportWithTable({
          withColumn: true,
        });
        const added: any = await service.addRowToSubmodelElementList(
          correlationId,
          passport.organizationId,
          passport.id,
          submodel.id,
          listPath,
          undefined,
          adminContext,
          latestVersion,
        );
        const [headerRow, addedRow] = added.value;
        expect(added.value).toHaveLength(2);

        const holder = {
          id: passport.id,
          organizationId: passport.organizationId,
          referenceType: DigitalProductDocumentTypes.Passport,
        };
        const [config] = await presentationConfigurationService.list(holder);
        await presentationConfigurationService.applyPatch(holder, config.id, {
          elementDesign: {
            [`section1.list.${addedRow.idShort}`]: PresentationComponentName.BigNumber,
          },
        });

        const rowPath = IdShortPath.create({ path: `section1.list.${addedRow.idShort}` });
        const rowPermissions = [
          Permissions.Read,
          Permissions.Edit,
          Permissions.Create,
          Permissions.Delete,
        ].map((permission) =>
          Permission.create({ permission, kindOfPermission: PermissionKind.Allow }),
        );
        aas.security.addPolicy(adminContext.subject, rowPath, rowPermissions);
        await assetAdministrationShellRepository.save(aas);

        const afterDelete: any = await service.deleteRowFromSubmodelElementList(
          correlationId,
          passport.organizationId,
          passport.id,
          submodel.id,
          listPath,
          addedRow.idShort,
          adminContext,
          latestVersion,
        );
        expect(afterDelete.value.map((row: any) => row.idShort)).toEqual([headerRow.idShort]);
        const [configAfter] = await presentationConfigurationService.list(holder);
        expect(Object.fromEntries(configAfter.elementDesign)).toEqual({});
        const aasAfter = await assetAdministrationShellRepository.findOneOrFail(aas.id);
        expect(aasAfter.security.hasPolicy(adminContext.subject, rowPath, rowPermissions)).toBe(
          false,
        );

        await expect(
          service.deleteRowFromSubmodelElementList(
            correlationId,
            passport.organizationId,
            passport.id,
            submodel.id,
            listPath,
            headerRow.idShort,
            adminContext,
            latestVersion,
          ),
        ).rejects.toThrow("The last row of a table cannot be deleted");
      });

      it("cannot add a row to a table without columns", async () => {
        const { passport, submodel, listPath } = await createPassportWithTable({
          withColumn: false,
        });

        await expect(
          service.addRowToSubmodelElementList(
            correlationId,
            passport.organizationId,
            passport.id,
            submodel.id,
            listPath,
            undefined,
            adminContext,
            latestVersion,
          ),
        ).rejects.toThrow("Cannot add a row to a table without columns");
      });
    });
  });

  afterAll(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
