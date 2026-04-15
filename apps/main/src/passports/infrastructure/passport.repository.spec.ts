import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";

import { Test } from "@nestjs/testing";

import { EnvModule, EnvService } from "@open-dpp/env";
import { Model, Model as MongooseModel } from "mongoose";

import { AasModule } from "../../aas/aas.module";
import { Environment } from "../../aas/domain/environment";

import { generateMongoConfig } from "../../database/config";
import { DppStatus, DppStatusChange } from "../../dpp/domain/dpp-status";
import { encodeCursor, Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { Passport } from "../domain/passport";
import { PassportRepository } from "./passport.repository";
import { PassportDoc, PassportDocVersion, PassportSchema } from "./passport.schema";

describe("passportRepository", () => {
  let passportRepository: PassportRepository;
  let PassportDocument: MongooseModel<PassportDoc>;
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
            name: PassportDoc.name,
            schema: PassportSchema,
          },
        ]),
        AasModule,
      ],
      providers: [PassportRepository],
    }).compile();

    passportRepository = module.get<PassportRepository>(PassportRepository);
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
      lastStatusChange: DppStatusChange.create({
        previousStatus: DppStatus.Draft,
        currentStatus: DppStatus.Published,
      }),
    });
    await passportRepository.save(passport);
    const foundAas = await passportRepository.findOneOrFail(passport.id);
    expect(foundAas).toEqual(passport);
  });

  it(`should load and migrate passport from version 1.0.0 to 1.1.0`, async () => {
    const id = randomUUID();
    const now = new Date();
    const legacyDoc = new PassportDocument({
      _id: id,
      _schemaVersion: PassportDocVersion.v1_0_0,
      organizationId: randomUUID(),
      templateId: randomUUID(),
      environment: {
        submodels: [randomUUID()],
        assetAdministrationShells: [randomUUID()],
        conceptDescriptions: [],
      },
      createdAt: now,
      updatedAt: now,
    });
    await legacyDoc.save({ validateBeforeSave: false });
    const foundPassport = await passportRepository.findOneOrFail(id);
    expect(foundPassport).toEqual(Passport.fromPlain({
      id,
      environment: Environment.fromPlain(legacyDoc.environment),
      templateId: legacyDoc.templateId,
      organizationId: legacyDoc.organizationId,
      createdAt: legacyDoc.createdAt,
      updatedAt: legacyDoc.updatedAt,
      lastStatusChange: DppStatusChange.create({}),
    }));
  });

  it("should delete a passport", async () => {
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
    await passportRepository.deleteById(passport.id);
    const foundAas = await passportRepository.findOne(passport.id);
    expect(foundAas).toBeUndefined();
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

    expect(foundTemplates).toEqual(
      PagingResult.create({
        pagination: Pagination.create({
          cursor: encodeCursor(p1.createdAt.toISOString(), p1.id),
          limit: 100,
        }),
        items: [p4, p3, p1],
      }),
    );
    let pagination = Pagination.create({
      cursor: encodeCursor(p4.createdAt.toISOString(), p4.id),
    });
    foundTemplates = await passportRepository.findAllByOrganizationId(organizationId, pagination);
    expect(foundTemplates).toEqual(
      PagingResult.create({
        pagination: Pagination.create({ cursor: encodeCursor(p1.createdAt.toISOString(), p1.id) }),
        items: [p3, p1],
      }),
    );
    pagination = Pagination.create({
      cursor: encodeCursor(p4.createdAt.toISOString(), p4.id),
      limit: 1,
    });
    foundTemplates = await passportRepository.findAllByOrganizationId(organizationId, pagination);
    expect(foundTemplates).toEqual(
      PagingResult.create({
        pagination: Pagination.create({
          cursor: encodeCursor(p3.createdAt.toISOString(), p3.id),
          limit: 1,
        }),
        items: [p3],
      }),
    );
  });

  afterAll(async () => {
    await module.close();
  });
});
