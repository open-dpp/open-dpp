import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";

import { Environment } from "../../aas/domain/environment";

import { encodeCursor, Pagination } from "../../aas/domain/pagination";
import { PagingResult } from "../../aas/domain/paging-result";
import { generateMongoConfig } from "../../database/config";
import { Template } from "../domain/template";
import { TemplateRepository } from "./template.repository";
import { TemplateDoc, TemplateSchema } from "./template.schema";

describe("templateRepository", () => {
  let templateRepository: TemplateRepository;
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
          {
            name: TemplateDoc.name,
            schema: TemplateSchema,
          },
        ]),
      ],
      providers: [
        TemplateRepository,
      ],
    }).compile();

    templateRepository = module.get<TemplateRepository>(TemplateRepository);
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

  afterAll(async () => {
    await module.close();
  });
});
