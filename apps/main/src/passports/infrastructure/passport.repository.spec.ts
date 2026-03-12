import type { TestingModule } from "@nestjs/testing";
import type { Model as MongooseModel } from "mongoose";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";

import { Test } from "@nestjs/testing";

import { Permissions } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Model } from "mongoose";
import { AasModule } from "../../aas/aas.module";
import { AssetAdministrationShell } from "../../aas/domain/asset-adminstration-shell";
import { Environment } from "../../aas/domain/environment";

import { AasResource } from "../../aas/domain/security/casl-ability";
import { Security } from "../../aas/domain/security/security";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { Submodel } from "../../aas/domain/submodel-base/submodel";
import { IdShortPath } from "../../aas/domain/submodel-base/submodel-base";
import { AasRepository } from "../../aas/infrastructure/aas.repository";
import { SecurityRepository } from "../../aas/infrastructure/security.repository";
import { SubmodelRepository } from "../../aas/infrastructure/submodel.repository";
import { generateMongoConfig } from "../../database/config";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { encodeCursor, Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { Passport } from "../domain/passport";
import { PassportRepository } from "./passport.repository";
import { PassportDoc, PassportDocVersion, PassportSchema } from "./passport.schema";

describe("passportRepository", () => {
  let passportRepository: PassportRepository;
  let securityRepository: SecurityRepository;
  let aasRepository: AasRepository;
  let submodelRepository: SubmodelRepository;
  let module: TestingModule;
  let PassportDocument: MongooseModel<PassportDoc>;

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
          {
            name: PassportDoc.name,
            schema: PassportSchema,
          },
        ]),
        AasModule,
      ],
      providers: [
        PassportRepository,
      ],
    }).compile();

    passportRepository = module.get<PassportRepository>(PassportRepository);
    securityRepository = module.get<SecurityRepository>(SecurityRepository);
    aasRepository = module.get<AasRepository>(AasRepository);
    submodelRepository = module.get<SubmodelRepository>(SubmodelRepository);
    PassportDocument = module.get<Model<PassportDoc>>(
      getModelToken(PassportDoc.name),
    );
  });

  it("should save a passport", async () => {
    const passport = Passport.create({
      id: randomUUID(),
      organizationId: randomUUID(),
      environment: Environment.create({
        assetAdministrationShells: [randomUUID()],
        submodels: [randomUUID()],
        conceptDescriptions: [randomUUID()],
      }),
    });
    await passportRepository.save(passport);
    const foundAas = await passportRepository.findOneOrFail(passport.id);
    expect(foundAas).toEqual(passport);
  });

  it(`should load and migrate aas from version 1.0.0 to 1.1.0`, async () => {
    const id = randomUUID();
    const security = Security.create({});
    await securityRepository.save(security);
    const submodel = await submodelRepository.save(Submodel.create({ idShort: "section1" }));
    const aas = AssetAdministrationShell.create({ security: security.id });
    aas.addSubmodel(submodel);

    await aasRepository.save(aas);
    const legacyDoc = new PassportDocument({
      _id: id,
      _schemaVersion: PassportDocVersion.v1_0_0,
      organizationId: randomUUID(),
      environment: {
        assetAdministrationShells: [aas.id],
        submodels: [submodel.id],
      },
      templateId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await legacyDoc.save();
    await passportRepository.findOneOrFail(id);
    const foundSecurity = await securityRepository.findOneOrFail(security.id);
    // admin should have all permissions
    let ability = foundSecurity.defineAbilityForSubject(SubjectAttributes.create({ role: UserRole.ADMIN }));
    for (const permission of [Permissions.Create, Permissions.Read, Permissions.Edit, Permissions.Delete]) {
      expect(ability.can({ action: permission, object: AasResource.create({ idShortPath: IdShortPath.create({ path: submodel.idShort }) }) })).toBeTruthy();
    }

    // member of the organization to which the passport belongs to should have all permissions
    ability = foundSecurity.defineAbilityForSubject(SubjectAttributes.create({ role: MemberRole.MEMBER, organizationId: legacyDoc.organizationId }));
    for (const permission of [Permissions.Create, Permissions.Read, Permissions.Edit, Permissions.Delete]) {
      expect(ability.can(
        { action: permission, object: AasResource.create({ idShortPath: IdShortPath.create({ path: submodel.idShort }), organizationId: legacyDoc.organizationId }) },
      )).toBeTruthy();
    }

    // anonymous user should have only read permissions
    ability = foundSecurity.defineAbilityForSubject(SubjectAttributes.create({ role: UserRole.ANONYMOUS }));
    expect(ability.can({ action: Permissions.Read, object: AasResource.create({ idShortPath: IdShortPath.create({ path: submodel.idShort }) }) })).toBeTruthy();
    for (const permission of [Permissions.Create, Permissions.Edit, Permissions.Delete]) {
      expect(ability.can({
        action: permission,
        object: AasResource.create({ idShortPath: IdShortPath.create({ path: submodel.idShort }) }),
      })).toBeFalsy();
    }
  });

  it("should find all passports of organization", async () => {
    const organizationId = randomUUID();
    const otherOrganizationId = randomUUID();

    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const date3 = new Date("2022-03-01T00:00:00.000Z");
    const date4 = new Date("2022-03-02T00:00:00.000Z");

    const p1 = Passport.create({
      id: randomUUID(),
      organizationId,
      environment: Environment.create({
        assetAdministrationShells: [randomUUID()],
        submodels: [randomUUID()],
        conceptDescriptions: [randomUUID()],
      }),
      createdAt: date1,
    });
    const p2OtherOrganization = Passport.create({
      id: randomUUID(),
      organizationId: otherOrganizationId,
      environment: Environment.create({
        assetAdministrationShells: [randomUUID()],
        submodels: [randomUUID()],
      }),
      createdAt: date2,
    });
    const p3 = Passport.create({
      id: randomUUID(),
      organizationId,
      environment: Environment.create({
        assetAdministrationShells: [randomUUID()],
      }),
      createdAt: date3,
    });
    const p4 = Passport.create({
      id: randomUUID(),
      organizationId,
      environment: Environment.create({
        assetAdministrationShells: [randomUUID()],
      }),
      createdAt: date4,
    });

    await passportRepository.save(p1);
    await passportRepository.save(p2OtherOrganization);
    await passportRepository.save(p3);
    await passportRepository.save(p4);

    let foundTemplates = await passportRepository.findAllByOrganizationId(organizationId);

    expect(foundTemplates).toEqual(PagingResult.create({
      pagination: Pagination.create({ cursor: encodeCursor(p1.createdAt.toISOString(), p1.id), limit: 100 }),
      items: [p4, p3, p1],
    }));
    let pagination = Pagination.create({
      cursor: encodeCursor(p4.createdAt.toISOString(), p4.id),
    });
    foundTemplates = await passportRepository.findAllByOrganizationId(organizationId, pagination);
    expect(foundTemplates).toEqual(PagingResult.create({
      pagination: Pagination.create({ cursor: encodeCursor(p1.createdAt.toISOString(), p1.id) }),
      items: [p3, p1],
    }));
    pagination = Pagination.create({
      cursor: encodeCursor(p4.createdAt.toISOString(), p4.id),
      limit: 1,
    });
    foundTemplates = await passportRepository.findAllByOrganizationId(organizationId, pagination);
    expect(foundTemplates).toEqual(PagingResult.create({
      pagination: Pagination.create({ cursor: encodeCursor(p3.createdAt.toISOString(), p3.id), limit: 1 }),
      items: [p3],
    }));
  });

  afterAll(async () => {
    await module.close();
  });
});
