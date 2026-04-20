import { randomUUID } from "node:crypto";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { KeyTypes, PresentationReferenceType } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { AasModule } from "../../../aas/aas.module";
import { Environment } from "../../../aas/domain/environment";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import {
  AssetAdministrationShellDoc,
  AssetAdministrationShellSchema,
} from "../../../aas/infrastructure/schemas/asset-administration-shell.schema";
import { SubmodelDoc, SubmodelSchema } from "../../../aas/infrastructure/schemas/submodel.schema";
import { generateMongoConfig } from "../../../database/config";
import { OrganizationsModule } from "../../../identity/organizations/organizations.module";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { UsersModule } from "../../../identity/users/users.module";
import { PresentationConfiguration } from "../../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../../presentation-configurations/infrastructure/presentation-configuration.repository";
import { PresentationConfigurationsModule } from "../../../presentation-configurations/presentation-configurations.module";
import { Passport } from "../../domain/passport";
import { PassportRepository } from "../../infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../infrastructure/passport.schema";
import { PassportService } from "./passport.service";

describe("passportService", () => {
  let service: PassportService;
  let passportRepository: PassportRepository;
  let presentationConfigurationRepository: PresentationConfigurationRepository;
  let module: TestingModule;

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
        ]),
        AasModule,
        UsersModule,
        OrganizationsModule,
        PresentationConfigurationsModule,
      ],
      providers: [PassportService, PassportRepository],
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

  it("materializes a PresentationConfiguration on first expansion when none pre-exists", async () => {
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

    const created = await presentationConfigurationRepository.findByReference({
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
    });
    expect(created).toBeDefined();
    expect(created?.organizationId).toBe(organizationId);
    expect(exported).toMatchObject({
      presentationConfiguration: {
        elementDesign: {},
        defaultComponents: {},
      },
    });
  });

  it("reuses the same PresentationConfiguration on subsequent expansions", async () => {
    const organizationId = randomUUID();
    const passport = Passport.create({
      organizationId,
      environment: Environment.create({}),
    });
    await passportRepository.save(passport);

    await service.getExpandedProductPassport(passport.id);
    const first = await presentationConfigurationRepository.findByReference({
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
    });
    expect(first).toBeDefined();

    await service.getExpandedProductPassport(passport.id);
    const second = await presentationConfigurationRepository.findByReference({
      referenceType: PresentationReferenceType.Passport,
      referenceId: passport.id,
    });

    expect(second?.id).toBe(first?.id);
  });
});
