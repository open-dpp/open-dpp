import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";

import { Environment } from "../../aas/domain/environment";

import { generateMongoConfig } from "../../database/config";
import { encodeCursor, Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { Passport } from "../domain/passport";
import { PassportRepository } from "./passport.repository";
import { PassportDoc, PassportSchema } from "./passport.schema";

describe("passportRepository", () => {
  let passportRepository: PassportRepository;
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
      ],
      providers: [
        PassportRepository,
      ],
    }).compile();

    passportRepository = module.get<PassportRepository>(PassportRepository);
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
