import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { generateMongoConfig } from "../database/config";
import { MIGRATIONS } from "./application/services/migration-runner.service";
import { Migration, sortMigrations } from "./domain/migration";
import { MIGRATION_CLASSES } from "./migrations";
import { MigrationsModule } from "./migrations.module";

describe("MigrationsModule", () => {
  let module: TestingModule;
  let migrations: Migration[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
        MigrationsModule,
      ],
    }).compile();
    migrations = module.get<Migration[]>(MIGRATIONS);
  });

  afterAll(async () => {
    await module.close();
  });

  it("provides every registered migration", () => {
    expect(migrations).toHaveLength(MIGRATION_CLASSES.length);
  });

  it("registers only valid, unique ids", () => {
    expect(() => sortMigrations(migrations)).not.toThrow();
  });

  it("registers every script in scripts/, each under its file name", () => {
    const scriptsDir = join(dirname(expect.getState().testPath!), "scripts");
    const scriptIds = readdirSync(scriptsDir)
      .filter((file) => file.endsWith(".ts") && !file.endsWith(".spec.ts"))
      .map((file) => file.replace(/\.ts$/, ""))
      .sort();

    expect(migrations.map((migration) => migration.id).sort()).toEqual(scriptIds);
  });
});
