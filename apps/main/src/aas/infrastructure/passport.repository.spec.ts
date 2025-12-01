import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";

import { generateMongoConfig } from "../../database/config";

import { Environment } from "../domain/environment";
import { Passport } from "../domain/passport";
import { PassportRepository } from "./passport.repository";
import { PassportDoc, PassportSchema } from "./schemas/passport.schema";

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

  afterAll(async () => {
    await module.close();
  });
});
