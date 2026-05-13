import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { DbSessionOptions } from "../../database/query-options";
import { DigitalProductDocumentStatus } from "../../digital-product-document/domain/digital-product-document-status";
import {
  findAllByOrganizationId,
  findOne,
  findOneOrFail,
  FindOptions,
  save,
} from "../../lib/repositories";
import { PagingResult } from "../../pagination/paging-result";
import { Passport } from "../domain/passport";
import { PassportDoc, PassportDocVersion } from "./passport.schema";
import { IDigitalProductDocumentRepository } from "../../digital-product-document/infrastructure/digital-product-document-repository.interface";

@Injectable()
export class PassportRepository implements IDigitalProductDocumentRepository<Passport> {
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
        ...plain.lastStatusChange,
        currentStatus: DigitalProductDocumentStatus.Draft,
      },
      _schemaVersion: PassportDocVersion.v1_1_0,
    };
  }

  async fromPlainWithMigration(plain: any): Promise<Passport> {
    let migratedVersion = plain;
    if (
      !migratedVersion._schemaVersion ||
      migratedVersion._schemaVersion === PassportDocVersion.v1_0_0
    ) {
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
    options?: FindOptions,
  ): Promise<PagingResult<Passport>> {
    return await findAllByOrganizationId(
      this.passportDoc,
      this.fromPlainWithMigration.bind(this),
      organizationId,
      options,
    );
  }

  async deleteById(id: string, options?: DbSessionOptions): Promise<void> {
    await this.passportDoc.findByIdAndDelete(id, options);
  }
}
