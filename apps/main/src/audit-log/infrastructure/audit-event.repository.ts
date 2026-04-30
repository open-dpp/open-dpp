import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { DbSessionOptions } from "../../database/query-options";
import { findOne, findOneOrFail } from "../../lib/repositories";
import { AuditEventDoc, AuditEventDocVersion } from "./audit-event.schema";
import { AuditEventHeaderSchema, IAuditEvent, parseAuditEvent } from "../audit-event";
import { decodeCursor, encodeCursor, Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";

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

  async findByAggregateId(
    aggregateId: string,
    options?: { pagination?: Pagination },
  ): Promise<PagingResult<IAuditEvent>> {
    const tmpPagination = options?.pagination ?? Pagination.create({ limit: 100 });

    const documents = await this.auditEventDoc
      .find({
        aggregateId,
        ...(tmpPagination.cursor && {
          $or: [
            { createdAt: { $lt: decodeCursor(tmpPagination.cursor).createdAt } },
            {
              createdAt: decodeCursor(tmpPagination.cursor).createdAt,
              id: { $lt: decodeCursor(tmpPagination.cursor).id },
            },
          ],
        }),
      })
      .sort({ createdAt: -1, id: -1 })
      .limit(tmpPagination.limit ?? 100)
      .exec();
    const domainObjects = await Promise.all(documents.map(this.fromPlain.bind(this)));
    if (domainObjects.length > 0) {
      const lastObject = domainObjects[domainObjects.length - 1];
      tmpPagination.setCursor(
        encodeCursor(lastObject.header.createdAt.toISOString(), lastObject.header.id),
      );
    }
    return PagingResult.create<IAuditEvent>({ pagination: tmpPagination, items: domainObjects });
  }

  async findOneOrFail(id: string): Promise<IAuditEvent> {
    return await findOneOrFail(id, this.auditEventDoc, this.fromPlain.bind(this));
  }

  async findOne(id: string): Promise<IAuditEvent | undefined> {
    return await findOne(id, this.auditEventDoc, this.fromPlain.bind(this));
  }
}
