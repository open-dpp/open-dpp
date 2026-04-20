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
import { expect } from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { DigitalProductDocumentService } from "./digital-product-document.service";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { ConceptDescriptionRepository } from "../../aas/infrastructure/concept-description.repository";
import {
  ConceptDescriptionDoc,
  ConceptDescriptionSchema,
} from "../../aas/infrastructure/schemas/concept-description.schema";

describe("DigitalProductDocumentService", () => {
  let service: DigitalProductDocumentService<Passport>;
  let module: TestingModule;
  let passportRepository: PassportRepository;

  beforeEach(async () => {
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

    passportRepository = module.get<PassportRepository>(PassportRepository);
    const environmentService = module.get<EnvironmentService>(EnvironmentService);
    service = new DigitalProductDocumentService(environmentService, passportRepository);
  });

  it("should fail on modifications of archived passports", async () => {
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
    await passportRepository.save(passport);
    const exception = new BadRequestException("Archived passport/ template cannot be modified");
    await expect(
      service.modifyShell(passport.organizationId, passport.id, randomUUID(), {}, subject),
    ).rejects.toThrow(exception);

    await expect(
      service.modifySubmodel(
        passport.organizationId,
        passport.id,
        randomUUID(),
        { idShort: "demo" },
        subject,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.modifyColumnOfSubmodelElementList(
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "demolist" }),
        "col1",
        { idShort: "col1" },
        subject,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.modifySubmodelElement(
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "col1" }),
        { idShort: "col1" },
        subject,
      ),
    ).rejects.toThrow(exception);

    await expect(
      service.modifySubmodelElementValue(
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "col1" }),
        {},
        subject,
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
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "demolist" }),
        "col1",
        subject,
      ),
    ).rejects.toThrow(exception);
    await expect(
      service.deleteRowFromSubmodelElementList(
        passport.organizationId,
        passport.id,
        randomUUID(),
        IdShortPath.create({ path: "demolist" }),
        "row1",
        subject,
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
  });

  afterAll(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
