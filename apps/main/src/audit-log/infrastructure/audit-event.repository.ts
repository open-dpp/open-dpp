import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { DbSessionOptions } from "../../database/query-options";
import { findOne, findOneOrFail } from "../../lib/repositories";
import { AuditEventDoc, AuditEventDocVersion } from "./audit-event.schema";
import { AuditEventHeaderSchema, IAuditEvent, parseAuditEvent } from "../audit-event";

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
    const header = AuditEventHeaderSchema.parse(plain);
    return parseAuditEvent({ header, payload: plain.payload });
  }

  async createMany(auditEvents: IAuditEvent[], options?: DbSessionOptions) {
    await this.auditEventDoc.insertMany(
      auditEvents.map(
        (auditEvent) => ({
          ...auditEvent.toDatabase(),
          _schemaVersion: AuditEventDocVersion.v1_0_0,
        }),
        { ...options, ordered: false },
      ),
    );
  }

  async findByAggregateId(aggregateId: string, options?: DbSessionOptions): Promise<IAuditEvent[]> {
    const documents: IAuditEvent[] = await this.auditEventDoc.find({ aggregateId }, options);
    return await Promise.all(documents.map(this.fromPlain.bind(this)));
  }

  async findOneOrFail(id: string): Promise<IAuditEvent> {
    return await findOneOrFail(id, this.auditEventDoc, this.fromPlain.bind(this));
  }

  async findOne(id: string): Promise<IAuditEvent | undefined> {
    return await findOne(id, this.auditEventDoc, this.fromPlain.bind(this));
  }
}
