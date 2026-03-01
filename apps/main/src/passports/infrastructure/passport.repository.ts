import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
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
  ) {
    this.passportDoc = passportDoc;
  }

  async save(passport: Passport, options?: DbSessionOptions) {
    return await save(passport, this.passportDoc, PassportDocVersion.v1_0_0, Passport.fromPlain, undefined, options);
  }

  async findOneOrFail(id: string) {
    return await findOneOrFail(id, this.passportDoc, Passport.fromPlain);
  }

  async findOne(id: string) {
    return await findOne(id, this.passportDoc, Passport.fromPlain);
  }

  async findAllByOrganizationId(organizationId: string, pagination?: Pagination): Promise<PagingResult<Passport>> {
    return await findAllByOrganizationId(this.passportDoc, Passport.fromPlain, organizationId, pagination);
  }
}
