import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
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
import { beforeAll, expect, jest } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { DigitalProductDocumentService } from "./digital-product-document.service";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { ConceptDescriptionRepository } from "../../aas/infrastructure/concept-description.repository";
import {
  ConceptDescriptionDoc,
  ConceptDescriptionSchema,
} from "../../aas/infrastructure/schemas/concept-description.schema";
import { KeyTypes } from "@open-dpp/dto";
import { ActivityRepository } from "../../activity-history/infrastructure/activity.repository";

import { Response } from "express";
import { Archiver } from "archiver";
import { ActivityHistoryModule } from "../../activity-history/activity-history.module";
import { AdministrativeInformation } from "../../aas/domain/common/administrative-information";
import { SubmodelActivity } from "../../activity-history/domain/aas/submodel.activity";
import { SubmodelOperationTypes } from "../../activity-history/submodel-operation-types";

describe("DigitalProductDocumentService", () => {
  let service: DigitalProductDocumentService<Passport>;
  let module: TestingModule;
  let passportRepository: PassportRepository;
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
        MongooseModule.forFeature([
          { name: PassportDoc.name, schema: PassportSchema },
          { name: AssetAdministrationShellDoc.name, schema: AssetAdministrationShellSchema },
          { name: SubmodelDoc.name, schema: SubmodelSchema },
          { name: UniqueProductIdentifierDoc.name, schema: UniqueProductIdentifierSchema },
          { name: ConceptDescriptionDoc.name, schema: ConceptDescriptionSchema },
        ]),
        ActivityHistoryModule,
        AasModule,
        UsersModule,
        OrganizationsModule,
      ],
      providers: [
        EnvironmentService,
        PassportRepository,
        UniqueProductIdentifierRepository,
        ConceptDescriptionRepository,
      ],
    }).compile();
    await module.init();
    passportRepository = module.get<PassportRepository>(PassportRepository);
    const environmentService = module.get<EnvironmentService>(EnvironmentService);
    activityRepository = module.get<ActivityRepository>(ActivityRepository);
    service = new DigitalProductDocumentService(
      environmentService,
      passportRepository,
      activityRepository,
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
    const exception = new BadRequestException("Archived passport/ template cannot be modified");
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
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.deleteSubmodel(passport.organizationId, passport.id, randomUUID(), subject),
    ).rejects.toThrow(exception);

    await expect(
      service.deleteSubmodelElement(
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "sub1" }),
        subject,
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
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.deletePolicyBySubjectAndObject(
        passport.organizationId,
        passport.id,
        {
          subject: SubjectAttributes.create({
            userRole: UserRole.ADMIN,
            memberRole: MemberRole.MEMBER,
          }),
          object: "policy1",
        },
        subject,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.createSubmodel(
        correlationId,
        passport.organizationId,
        passport.id,
        { idShort: "sub" },
        userContext,
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
      ),
    ).rejects.toThrow(exception);
  });

  it("should download activities", async () => {
    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const date3 = new Date("2022-03-01T00:00:00.000Z");
    const date4 = new Date("2022-03-03T00:00:00.000Z");
    const organizationId = randomUUID();
    const submodelId = randomUUID();
    const submodelIdShort = "submodelIdShort";

    const passport = Passport.create({
      organizationId,
      environment: Environment.create({}),
    });
    await passportRepository.save(passport);
    const createActivity = (idShort: string, createdAt: Date) =>
      SubmodelActivity.create({
        digitalProductDocumentId: passport.id,
        submodelId,
        fullIdShortPath: IdShortPath.create({ path: `${submodelIdShort}.${idShort}` }),
        oldData: { idShort, value: "oldValue" },
        newData: { idShort, value: "newValue" },
        administration: AdministrativeInformation.create({ version: "2", revision: "0" }),
        operation: SubmodelOperationTypes.SubmodelElementModified,
        createdAt,
      });

    const event1 = createActivity("prop1", date1);

    const event2 = createActivity("prop2", date2);
    const event3 = createActivity("prop3", date3);

    const event4 = createActivity("prop4", date4);
    const activities = [event1, event2, event3, event4];
    activities.forEach((activity) => activity.header.assignCorrelationId(randomUUID()));
    await activityRepository.createMany(activities);
    const res = {
      set: jest.fn(),
    } as unknown as Response;

    const subject = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });

    const mockArchive = {
      pipe: jest.fn(),
      append: jest.fn(),
      finalize: jest.fn(),
    } as unknown as Archiver;

    await service.downloadActivitiesWithArchiver(
      res,
      organizationId,
      passport.id,
      subject,
      date1.toISOString(),
      date4.toISOString(),
      2,
      mockArchive,
    );
    expect(mockArchive.append).toHaveBeenNthCalledWith(
      1,
      JSON.stringify([event1.toPlain(), event2.toPlain()], null, 2),
      {
        name: `${date1.toISOString()}-${date2.toISOString()}.json`,
      },
    );

    expect(mockArchive.append).toHaveBeenNthCalledWith(
      2,
      JSON.stringify([event3.toPlain(), event4.toPlain()], null, 2),
      {
        name: `${date3.toISOString()}-${date4.toISOString()}.json`,
      },
    );
    expect(res.set).toHaveBeenCalledWith({
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="activities.zip"',
    });
    expect(mockArchive.pipe).toHaveBeenCalledWith(res);
    expect(mockArchive.append).toHaveBeenCalledTimes(2);
    expect(mockArchive.finalize).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
