import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InitializeSecurityMigrationService } from "../../aas/infrastructure/initialize-security-migration.service";
import { DbSessionOptions } from "../../database/query-options";
import { findAllByOrganizationId, findOne, findOneOrFail, save } from "../../lib/repositories";
import { Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { Passport } from "../domain/passport";
import { PassportDoc, PassportDocVersion } from "./passport.schema";

@Injectable()
export class PassportRepository {
  private passportDoc: MongooseModel<PassportDoc>;

  constructor(
    @InjectModel(PassportDoc.name)
    passportDoc: MongooseModel<PassportDoc>,
    private readonly initializeSecurityMigrationService: InitializeSecurityMigrationService,
  ) {
    this.passportDoc = passportDoc;
  }

  async fromPlain(plain: any) {
    return Passport.fromPlain(plain);
  }

  async fromPlainWithMigration(plain: any): Promise<Passport> {
    let migratedVersion = plain;
    if (plain._schemaVersion === PassportDocVersion.v1_0_0) {
      migratedVersion = await this.migration1_0_0To1_1_0(migratedVersion);
    }
    return this.fromPlain(migratedVersion);
  }

  async migration1_0_0To1_1_0(passport: { environment: { assetAdministrationShells: string[]; submodels: string[] }; organizationId: string }) {
    await this.initializeSecurityMigrationService.migrate(passport);
    return {
      ...passport,
      _schemaVersion: PassportDocVersion.v1_1_0,
    };
  }

  async save(passport: Passport, options?: DbSessionOptions) {
    return await save(passport, this.passportDoc, PassportDocVersion.v1_1_0, this.fromPlain.bind(this), undefined, options);
  }

  async findOneOrFail(id: string) {
    return await findOneOrFail(id, this.passportDoc, this.fromPlainWithMigration.bind(this));
  }

  async findOne(id: string) {
    return await findOne(id, this.passportDoc, this.fromPlainWithMigration.bind(this));
  }

  async findAllByOrganizationId(organizationId: string, pagination?: Pagination): Promise<PagingResult<Passport>> {
    return await findAllByOrganizationId(this.passportDoc, Passport.fromPlain, organizationId, pagination);
  }
}
