import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { DbSessionOptions } from "../../database/query-options";
import { DppStatus } from "../../dpp/domain/dpp-status";
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
  ) {
    this.passportDoc = passportDoc;
  }

  async fromPlain(plain: any) {
    return Passport.fromPlain(plain);
  }

  migrate1_0_0To1_1_0(plain: any) {
    return {
      ...plain,
      lastStatusChange: {
        currentStatus: DppStatus.Draft,
      },
      _schemaVersion: PassportDocVersion.v1_1_0,
    };
  }

  async fromPlainWithMigration(plain: any): Promise<Passport> {
    let migratedVersion = plain;
    if (migratedVersion._schemaVersion === PassportDocVersion.v1_0_0) {
      migratedVersion = this.migrate1_0_0To1_1_0(migratedVersion);
    }
    return this.fromPlain(migratedVersion);
  }

  async save(passport: Passport, options?: DbSessionOptions) {
    return await save(
      passport,
      this.passportDoc,
      PassportDocVersion.v1_1_0,
      this.fromPlain.bind(this),
      undefined,
      options,
    );
  }

  async findOneOrFail(id: string) {
    return await findOneOrFail(id, this.passportDoc, this.fromPlainWithMigration.bind(this));
  }

  async findOne(id: string) {
    return await findOne(id, this.passportDoc, this.fromPlainWithMigration.bind(this));
  }

  async findAllByOrganizationId(
    organizationId: string,
    pagination?: Pagination,
  ): Promise<PagingResult<Passport>> {
    return await findAllByOrganizationId(
      this.passportDoc,
      this.fromPlainWithMigration.bind(this),
      organizationId,
      pagination,
    );
  }

  async deleteById(id: string, options?: DbSessionOptions): Promise<void> {
    await this.passportDoc.findByIdAndDelete(id, options);
  }
}
