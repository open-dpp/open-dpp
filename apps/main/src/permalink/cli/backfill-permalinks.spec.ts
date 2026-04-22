import type { INestApplicationContext } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import type { Connection } from "mongoose";
import { PresentationReferenceType } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";

import { Environment } from "../../aas/domain/environment";
import { generateMongoConfig } from "../../database/config";
import { Passport } from "../../passports/domain/passport";
import { PassportRepository } from "../../passports/infrastructure/passport.repository";
import { PassportDoc, PassportSchema } from "../../passports/infrastructure/passport.schema";
import { PresentationConfiguration } from "../../presentation-configurations/domain/presentation-configuration";
import { PresentationConfigurationRepository } from "../../presentation-configurations/infrastructure/presentation-configuration.repository";
import {
  PresentationConfigurationDoc,
  PresentationConfigurationSchema,
} from "../../presentation-configurations/infrastructure/presentation-configuration.schema";
import { Permalink } from "../domain/permalink";
import { PermalinkRepository } from "../infrastructure/permalink.repository";
import { PermalinkDoc, PermalinkSchema } from "../infrastructure/permalink.schema";
import { runBackfill } from "./backfill-permalinks";

describe("runBackfill", () => {
  let module: TestingModule;
  let connection: Connection;
  let permalinkRepository: PermalinkRepository;
  let presentationConfigurationRepository: PresentationConfigurationRepository;
  let passportRepository: PassportRepository;

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
          { name: PermalinkDoc.name, schema: PermalinkSchema },
          { name: PresentationConfigurationDoc.name, schema: PresentationConfigurationSchema },
          { name: PassportDoc.name, schema: PassportSchema },
        ]),
      ],
      providers: [PermalinkRepository, PresentationConfigurationRepository, PassportRepository],
    }).compile();

    permalinkRepository = module.get(PermalinkRepository);
    presentationConfigurationRepository = module.get(PresentationConfigurationRepository);
    passportRepository = module.get(PassportRepository);
    connection = module.get<Connection>(getConnectionToken());
  });

  beforeEach(async () => {
    await Promise.all([
      connection.collection("permalinkdocs").deleteMany({}),
      connection.collection("presentationconfigurationdocs").deleteMany({}),
      connection.collection("passportdocs").deleteMany({}),
    ]);
  });

  it("creates a config + permalink for every passport and preserves existing permalinks", async () => {
    const passports = await Promise.all(
      Array.from({ length: 3 }, () =>
        passportRepository.save(
          Passport.create({
            id: randomUUID(),
            organizationId: `org-${randomUUID().slice(0, 8)}`,
            environment: Environment.create({}),
          }),
        ),
      ),
    );

    // Seed: passport[0] has a pre-existing config + permalink (should be preserved).
    const existingConfig = await presentationConfigurationRepository.save(
      PresentationConfiguration.createForPassport({
        organizationId: passports[0].organizationId,
        referenceId: passports[0].id,
      }),
    );
    const preExistingPermalink = await permalinkRepository.save(
      Permalink.create({ presentationConfigurationId: existingConfig.id }),
    );

    const result = await runBackfill(module as unknown as INestApplicationContext);

    expect(result.failed).toBe(0);
    for (const passport of passports) {
      const config = await presentationConfigurationRepository.findByReference({
        referenceType: PresentationReferenceType.Passport,
        referenceId: passport.id,
      });
      expect(config).toBeDefined();
      const permalink = await permalinkRepository.findByPresentationConfigurationId(config!.id);
      expect(permalink).toBeDefined();
    }

    const preserved = await permalinkRepository.findByPresentationConfigurationId(
      existingConfig.id,
    );
    expect(preserved?.id).toBe(preExistingPermalink.id);
  });

  afterAll(async () => {
    await module.close();
  });
});
