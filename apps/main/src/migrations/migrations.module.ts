import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  MIGRATIONS,
  MigrationRunnerService,
} from "./application/services/migration-runner.service";
import { Migration } from "./domain/migration";
import { AppliedMigrationRepository } from "./infrastructure/applied-migration.repository";
import {
  AppliedMigrationDoc,
  AppliedMigrationSchema,
} from "./infrastructure/applied-migration.schema";
import { MIGRATION_CLASSES } from "./migrations";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AppliedMigrationDoc.name, schema: AppliedMigrationSchema }]),
  ],
  providers: [
    ...MIGRATION_CLASSES,
    {
      provide: MIGRATIONS,
      useFactory: (...migrations: Migration[]) => migrations,
      inject: MIGRATION_CLASSES,
    },
    AppliedMigrationRepository,
    MigrationRunnerService,
  ],
})
export class MigrationsModule {}
