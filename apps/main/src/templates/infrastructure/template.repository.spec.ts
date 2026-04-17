import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";

import { EnvModule, EnvService } from "@open-dpp/env";
import { Model, Model as MongooseModel } from "mongoose";
import { AasModule } from "../../aas/aas.module";
import { Environment } from "../../aas/domain/environment";
import { generateMongoConfig } from "../../database/config";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusChange,
} from "../../digital-product-document/domain/digital-product-document-status";
import { encodeCursor, Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { Template } from "../domain/template";
import { TemplateRepository } from "./template.repository";
import { TemplateDoc, TemplateDocVersion, TemplateSchema } from "./template.schema";

describe("templateRepository", () => {
  let templateRepository: TemplateRepository;
  let TemplateDocument: MongooseModel<TemplateDoc>;

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
        AasModule,
      ],
      providers: [TemplateRepository],
    }).compile();

    templateRepository = module.get<TemplateRepository>(TemplateRepository);
    TemplateDocument = module.get<Model<TemplateDoc>>(getModelToken(TemplateDoc.name));
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
      lastStatusChange: DigitalProductDocumentStatusChange.create({
        previousStatus: DigitalProductDocumentStatus.Draft,
        currentStatus: DigitalProductDocumentStatus.Published,
      }),
    });
    await templateRepository.save(template);
    const foundTemplate = await templateRepository.findOneOrFail(template.id);
    expect(foundTemplate).toEqual(template);
  });

  it(`should load and migrate passport from version 1.0.0 to 1.1.0`, async () => {
    const id = randomUUID();
    const now = new Date();
    const legacyDoc = new TemplateDocument({
      _id: id,
      _schemaVersion: TemplateDocVersion.v1_0_0,
      organizationId: randomUUID(),
      environment: {
        submodels: [randomUUID()],
        assetAdministrationShells: [randomUUID()],
        conceptDescriptions: [],
      },
      createdAt: now,
      updatedAt: now,
    });
    await legacyDoc.save({ validateBeforeSave: false });
    const foundTemplate = await templateRepository.findOneOrFail(id);
    expect(foundTemplate).toEqual(
      Template.fromPlain({
        id,
        environment: Environment.fromPlain(legacyDoc.environment),
        organizationId: legacyDoc.organizationId,
        createdAt: legacyDoc.createdAt,
        updatedAt: legacyDoc.updatedAt,
        lastStatusChange: DigitalProductDocumentStatusChange.create({}),
      }),
    );
  });

  it("should delete a template", async () => {
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
    await templateRepository.deleteById(template.id);
    const foundTemplate = await templateRepository.findOne(template.id);
    expect(foundTemplate).toBeUndefined();
  });

  it("should filter templates of version 1.0.0 as draft", async () => {
    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const organizationId = randomUUID();
    const createLegacyDoc = async (date: Date) => {
      const legacyDoc = new TemplateDocument({
        _id: randomUUID(),
        _schemaVersion: TemplateDocVersion.v1_0_0,
        organizationId,
        environment: {
          submodels: [],
          assetAdministrationShells: [],
          conceptDescriptions: [],
        },
        createdAt: date,
        updatedAt: date,
      });
      return await legacyDoc.save({ validateBeforeSave: false });
    };

    const legacyDoc1 = await createLegacyDoc(date1);
    const legacyDoc2 = await createLegacyDoc(date2);
    let foundTemplates = await templateRepository.findAllByOrganizationId(organizationId, {
      filter: {
        status: DigitalProductDocumentStatus.Draft,
      },
    });
    expect(foundTemplates.items.map((p) => p.id)).toEqual([legacyDoc2.id, legacyDoc1.id]);
    foundTemplates = await templateRepository.findAllByOrganizationId(organizationId, {
      filter: {
        status: DigitalProductDocumentStatus.Published,
      },
    });
    expect(foundTemplates.items.map((p) => p.id)).toEqual([]);
  });

  it("should find all templates of organization", async () => {
    const organizationId = randomUUID();
    const otherOrganizationId = randomUUID();

    const date1 = new Date("2022-01-01T00:00:00.000Z");
    const date2 = new Date("2022-02-01T00:00:00.000Z");
    const date3 = new Date("2022-03-01T00:00:00.000Z");
    const date4 = new Date("2022-03-02T00:00:00.000Z");
    const date5 = new Date("2022-03-03T00:00:00.000Z");

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
    const t5 = Template.create({
      id: randomUUID(),
      organizationId,
      environment: Environment.create({
        assetAdministrationShells: [randomUUID()],
      }),
      createdAt: date5,
      lastStatusChange: DigitalProductDocumentStatusChange.create({
        previousStatus: DigitalProductDocumentStatus.Draft,
        currentStatus: DigitalProductDocumentStatus.Archived,
      }),
    });

    await templateRepository.save(t1);
    await templateRepository.save(t2OtherOrganization);
    await templateRepository.save(t3);
    await templateRepository.save(t4);
    await templateRepository.save(t5);

    let foundTemplates = await templateRepository.findAllByOrganizationId(organizationId);

    expect(foundTemplates).toEqual(
      PagingResult.create({
        pagination: Pagination.create({
          cursor: encodeCursor(t1.createdAt.toISOString(), t1.id),
          limit: 100,
        }),
        items: [t5, t4, t3, t1],
      }),
    );

    foundTemplates = await templateRepository.findAllByOrganizationId(organizationId, {
      filter: {
        status: DigitalProductDocumentStatus.Archived,
      },
    });

    expect(foundTemplates).toEqual(
      PagingResult.create({
        pagination: Pagination.create({
          cursor: encodeCursor(t5.createdAt.toISOString(), t5.id),
          limit: 100,
        }),
        items: [t5],
      }),
    );

    let pagination = Pagination.create({
      cursor: encodeCursor(t4.createdAt.toISOString(), t4.id),
    });
    foundTemplates = await templateRepository.findAllByOrganizationId(organizationId, {
      pagination,
    });
    expect(foundTemplates).toEqual(
      PagingResult.create({
        pagination: Pagination.create({ cursor: encodeCursor(t1.createdAt.toISOString(), t1.id) }),
        items: [t3, t1],
      }),
    );
    pagination = Pagination.create({
      cursor: encodeCursor(t4.createdAt.toISOString(), t4.id),
      limit: 1,
    });
    foundTemplates = await templateRepository.findAllByOrganizationId(organizationId, {
      pagination,
    });
    expect(foundTemplates).toEqual(
      PagingResult.create({
        pagination: Pagination.create({
          cursor: encodeCursor(t3.createdAt.toISOString(), t3.id),
          limit: 1,
        }),
        items: [t3],
      }),
    );
  });

  afterAll(async () => {
    await module.close();
  });
});
