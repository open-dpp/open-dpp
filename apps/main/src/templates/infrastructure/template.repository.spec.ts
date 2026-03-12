import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { Permissions } from "@open-dpp/dto";

import { EnvModule, EnvService } from "@open-dpp/env";
import { Model, Model as MongooseModel } from "mongoose";
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
import { PassportDocVersion } from "../../passports/infrastructure/passport.schema";
import { Template } from "../domain/template";
import { TemplateRepository } from "./template.repository";
import { TemplateDoc, TemplateSchema } from "./template.schema";

describe("templateRepository", () => {
  let templateRepository: TemplateRepository;
  let securityRepository: SecurityRepository;
  let aasRepository: AasRepository;
  let submodelRepository: SubmodelRepository;
  let module: TestingModule;
  let TemplateDocument: MongooseModel<TemplateDoc>;

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
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
        ]),
        AasModule,
      ],
      providers: [
        TemplateRepository,
      ],
    }).compile();

    templateRepository = module.get<TemplateRepository>(TemplateRepository);
    securityRepository = module.get<SecurityRepository>(SecurityRepository);
    aasRepository = module.get<AasRepository>(AasRepository);
    submodelRepository = module.get<SubmodelRepository>(SubmodelRepository);
    TemplateDocument = module.get<Model<TemplateDoc>>(
      getModelToken(TemplateDoc.name),
    );
  });

  it("should save a template", async () => {
    const template = Template.create({
      id: randomUUID(),
      organizationId: randomUUID(),
      environment: Environment.create({
        assetAdministrationShells: [randomUUID()],
        submodels: [randomUUID()],
        conceptDescriptions: [randomUUID()],
      }),
    });
    await templateRepository.save(template);
    const foundTemplate = await templateRepository.findOneOrFail(template.id);
    expect(foundTemplate).toEqual(template);
  });

  it("should find all templates of organization", async () => {
    const organizationId = randomUUID();
    const otherOrganizationId = randomUUID();

    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const date3 = new Date("2022-03-01T00:00:00.000Z");
    const date4 = new Date("2022-03-02T00:00:00.000Z");

    const t1 = Template.create({
      id: randomUUID(),
      organizationId,
      environment: Environment.create({
        assetAdministrationShells: [randomUUID()],
        submodels: [randomUUID()],
        conceptDescriptions: [randomUUID()],
      }),
      createdAt: date1,
    });
    const t2OtherOrganization = Template.create({
      id: randomUUID(),
      organizationId: otherOrganizationId,
      environment: Environment.create({
        assetAdministrationShells: [randomUUID()],
        submodels: [randomUUID()],
      }),
      createdAt: date2,
    });
    const t3 = Template.create({
      id: randomUUID(),
      organizationId,
      environment: Environment.create({
        assetAdministrationShells: [randomUUID()],
      }),
      createdAt: date3,
    });
    const t4 = Template.create({
      id: randomUUID(),
      organizationId,
      environment: Environment.create({
        assetAdministrationShells: [randomUUID()],
      }),
      createdAt: date4,
    });
    await templateRepository.save(t1);
    await templateRepository.save(t2OtherOrganization);
    await templateRepository.save(t3);
    await templateRepository.save(t4);

    let foundTemplates = await templateRepository.findAllByOrganizationId(organizationId);

    expect(foundTemplates).toEqual(PagingResult.create({
      pagination: Pagination.create({ cursor: encodeCursor(t1.createdAt.toISOString(), t1.id), limit: 100 }),
      items: [t4, t3, t1],
    }));
    let pagination = Pagination.create({
      cursor: encodeCursor(t4.createdAt.toISOString(), t4.id),
    });
    foundTemplates = await templateRepository.findAllByOrganizationId(organizationId, pagination);
    expect(foundTemplates).toEqual(PagingResult.create({
      pagination: Pagination.create({ cursor: encodeCursor(t1.createdAt.toISOString(), t1.id) }),
      items: [t3, t1],
    }));
    pagination = Pagination.create({
      cursor: encodeCursor(t4.createdAt.toISOString(), t4.id),
      limit: 1,
    });
    foundTemplates = await templateRepository.findAllByOrganizationId(organizationId, pagination);
    expect(foundTemplates).toEqual(PagingResult.create({
      pagination: Pagination.create({ cursor: encodeCursor(t3.createdAt.toISOString(), t3.id), limit: 1 }),
      items: [t3],
    }));
  });

  it(`should load and migrate aas from version 1.0.0 to 1.1.0`, async () => {
    const id = randomUUID();
    const security = Security.create({});
    await securityRepository.save(security);
    const submodel = await submodelRepository.save(Submodel.create({ idShort: "section1" }));
    const aas = AssetAdministrationShell.create({ security: security.id });
    aas.addSubmodel(submodel);

    await aasRepository.save(aas);
    const legacyDoc = new TemplateDocument({
      _id: id,
      _schemaVersion: PassportDocVersion.v1_0_0,
      organizationId: randomUUID(),
      environment: {
        assetAdministrationShells: [aas.id],
        submodels: [submodel.id],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await legacyDoc.save();
    await templateRepository.findOneOrFail(id);
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

  afterAll(async () => {
    await module.close();
  });
});
