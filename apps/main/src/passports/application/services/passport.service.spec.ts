import { randomUUID } from "node:crypto";
import { ForbiddenException } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { KeyTypes, PresentationReferenceType } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { AasModule } from "../../../aas/aas.module";
import { Environment } from "../../../aas/domain/environment";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
} from "../../../digital-product-document/domain/digital-product-document-status";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../../../aas/infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "../../../aas/infrastructure/schemas/submodel.schema";
import { generateMongoConfig } from "../../../database/config";
import { OrganizationsModule } from "../../../identity/organizations/organizations.module";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { UsersModule } from "../../../identity/users/users.module";
import { PermalinkModule } from "../../../permalink/permalink.module";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { PresentationConfigurationsModule } from "../../../presentation-configurations/presentation-configurations.module";
import { UniqueProductIdentifierRepository } from "../../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchema,
} from "../../../unique-product-identifier/infrastructure/unique-product-identifier.schema";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../infrastructure/passport.schema";
import { PassportService } from "./passport.service";

describe("passportService", () => {
  let service: PassportService;
  let passportRepository: PassportRepository;
  let presentationConfigurationRepository: PresentationConfigurationRepository;
  let module: TestingModule;

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
        ]),
        AasModule,
        UsersModule,
        OrganizationsModule,
        PresentationConfigurationsModule,
        PermalinkModule,
      ],
      providers: [PassportService, PassportRepository, UniqueProductIdentifierRepository],
    }).compile();

    service = module.get<PassportService>(PassportService);
    passportRepository = module.get<PassportRepository>(PassportRepository);
    presentationConfigurationRepository = module.get<PresentationConfigurationRepository>(
      PresentationConfigurationRepository,
    );
  });

  afterAll(async () => {
    await module.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("threads the stored presentationConfiguration into the exported passport", async () => {
    const organizationId = randomUUID();
    const passport = Passport.create({
      organizationId,
      environment: Environment.create({}),
    });
    await passportRepository.save(passport);

    await presentationConfigurationRepository.save(
      PresentationConfiguration.create({
        organizationId,
        referenceId: passport.id,
        referenceType: PresentationReferenceType.Passport,
        elementDesign: { "submodel-1.prop-1": "BigNumber" },
        defaultComponents: { [KeyTypes.Property]: "BigNumber" },
      }),
    );

    const exportable = await service.getExpandedProductPassport(passport.id);
    const exported = exportable.toExportPlain(
      SubjectAttributes.create({ userRole: UserRole.ADMIN }),
    );

    expect(exported).toMatchObject({
      presentationConfiguration: {
        elementDesign: { "submodel-1.prop-1": "BigNumber" },
        defaultComponents: { [KeyTypes.Property]: "BigNumber" },
      },
    });
  });

  it("returns an in-memory default PresentationConfiguration without writing when none exists", async () => {
    const organizationId = randomUUID();
    const passport = Passport.create({
      organizationId,
      environment: Environment.create({}),
    });
    await passportRepository.save(passport);

    expect(
      await presentationConfigurationRepository.findByReference({
        referenceType: PresentationReferenceType.Passport,
        referenceId: passport.id,
      }),
    ).toBeUndefined();

    const exportable = await service.getExpandedProductPassport(passport.id);
    const exported = exportable.toExportPlain(
      SubjectAttributes.create({ userRole: UserRole.ADMIN }),
    );

    // GET must not lazy-create a row.
    expect(
      await presentationConfigurationRepository.findByReference({
        referenceType: PresentationReferenceType.Passport,
        referenceId: passport.id,
      }),
    ).toBeUndefined();
    expect(exported).toMatchObject({
      presentationConfiguration: {
        elementDesign: {},
        defaultComponents: {},
      },
    });
  });

  it("deletePassport rejects non-draft passports", async () => {
    const organizationId = randomUUID();
    const subject = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });

    const published = Passport.create({
      organizationId,
      environment: Environment.create({}),
      lastStatusChange: DigitalProductDocumentStatusChange.create({
        previousStatus: DigitalProductDocumentStatus.Draft,
        currentStatus: DigitalProductDocumentStatus.Published,
      }),
    });
    await passportRepository.save(published);

    await expect(service.deletePassport(published.id, organizationId, subject)).rejects.toThrow(
      ForbiddenException,
    );

    const archived = Passport.create({
      organizationId,
      environment: Environment.create({}),
      lastStatusChange: DigitalProductDocumentStatusChange.create({
        previousStatus: DigitalProductDocumentStatus.Draft,
        currentStatus: DigitalProductDocumentStatus.Archived,
      }),
    });
    await passportRepository.save(archived);

    await expect(service.deletePassport(archived.id, organizationId, subject)).rejects.toThrow(
      ForbiddenException,
    );

    expect(await passportRepository.findOne(published.id)).toBeDefined();
    expect(await passportRepository.findOne(archived.id)).toBeDefined();
  });

  it("deletePassport allows deletion when status is Draft", async () => {
    const organizationId = randomUUID();
    const subject = SubjectAttributes.create({
      userRole: UserRole.USER,
      memberRole: MemberRole.MEMBER,
    });
    const draft = Passport.create({
      organizationId,
      environment: Environment.create({}),
    });
    await passportRepository.save(draft);

    await expect(
      service.deletePassport(draft.id, organizationId, subject),
    ).resolves.toBeUndefined();

    expect(await passportRepository.findOne(draft.id)).toBeUndefined();
  });

  it("does not write a PresentationConfiguration row across multiple expansions", async () => {
    const organizationId = randomUUID();
    const passport = Passport.create({
      organizationId,
      environment: Environment.create({}),
    });
    await passportRepository.save(passport);

    await service.getExpandedProductPassport(passport.id);
    await service.getExpandedProductPassport(passport.id);

    expect(
      await presentationConfigurationRepository.findByReference({
        referenceType: PresentationReferenceType.Passport,
        referenceId: passport.id,
      }),
    ).toBeUndefined();
  });
});
