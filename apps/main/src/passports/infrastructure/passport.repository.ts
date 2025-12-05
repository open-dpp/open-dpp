import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { findOne, findOneOrFail, save } from "../../aas/infrastructure/repository-helpers";
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

  async save(passport: Passport) {
    return await save(passport, this.passportDoc, PassportDocVersion.v1_0_0, Passport.fromPlain);
  }

  async findOneOrFail(id: string) {
    return await findOneOrFail(id, this.passportDoc, Passport.fromPlain);
  }

  async findOne(id: string) {
    return await findOne(id, this.passportDoc, Passport.fromPlain);
  }
}
