import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { DbSessionOptions } from "../../database/query-options";
import { findOne, findOneOrFail, save } from "../../lib/repositories";
import { AuditEventDoc, AuditEventDocVersion } from "./audit-event.schema";
import { IAuditEvent, parseAuditEvent } from "../audit-event";

@Injectable()
export class AuditEventRepository {
  private auditEventDoc: MongooseModel<AuditEventDoc>;

  constructor(
    @InjectModel(AuditEventDoc.name)
    passportDoc: MongooseModel<AuditEventDoc>,
  ) {
    this.auditEventDoc = passportDoc;
  }

  async fromPlain(plain: any) {
    return parseAuditEvent(plain);
  }

  async save(audit: IAuditEvent, options?: DbSessionOptions) {
    return await save(
      audit,
      this.auditEventDoc,
      AuditEventDocVersion.v1_0_0,
      this.fromPlain.bind(this),
      undefined,
      options,
    );
  }

  async findOneOrFail(id: string) {
    return await findOneOrFail(id, this.auditEventDoc, this.fromPlain.bind(this));
  }

  async findOne(id: string) {
    return await findOne(id, this.auditEventDoc, this.fromPlain.bind(this));
  }
}
