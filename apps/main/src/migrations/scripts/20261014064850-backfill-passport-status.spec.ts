import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../../database/config";
import { BackfillPassportStatusMigration } from "./20261014064850-backfill-passport-status";

describe("BackfillPassportStatusMigration", () => {
  let module: TestingModule;
  let migration: BackfillPassportStatusMigration;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
      ],
      providers: [BackfillPassportStatusMigration],
    }).compile();

    migration = module.get(BackfillPassportStatusMigration);
  });

  afterAll(async () => {
    await module.close();
  });

  it("has the id of its file", () => {
    expect(migration.id).toBe("20261014064850-backfill-passport-status");
  });

  it.todo("migrates the data");

  it.todo("is idempotent (use expectMigrationToBeIdempotent from test/utils.for.test)");
});
