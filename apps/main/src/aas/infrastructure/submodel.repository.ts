import type { ClientSession, Connection, Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { findByIds, findOne, findOneOrFail, save } from "../../lib/repositories";
import { Submodel } from "../domain/submodel-base/submodel";
import { SubmodelDbSchema } from "./schemas/submodel-base/submodel-db-schema";
import { SubmodelDoc, SubmodelDocSchemaVersion } from "./schemas/submodel.schema";
import { AuditEventRepository } from "../../audit-log/infrastructure/audit-event.repository";

@Injectable()
export class SubmodelRepository {
  private submodelDoc: MongooseModel<SubmodelDoc>;

  constructor(
    @InjectModel(SubmodelDoc.name)
    submodelDoc: MongooseModel<SubmodelDoc>,
    private readonly auditEventRepository: AuditEventRepository,
    @InjectConnection() private connection: Connection,
  ) {
    this.submodelDoc = submodelDoc;
  }

  async fromPlain(plain: any) {
    return Submodel.fromPlain(SubmodelDbSchema.encode(plain));
  }

  async saveWithSession(submodel: Submodel, options?: DbSessionOptions) {
    const events = submodel.pullAuditEvents();
    await this.auditEventRepository.createMany(events, options);
    return await save(
      submodel,
      this.submodelDoc,
      SubmodelDocSchemaVersion.v1_0_0,
      this.fromPlain,
      SubmodelDbSchema,
      options,
    );
  }

  async save(submodel: Submodel, options?: DbSessionOptions) {
    if (options?.session) {
      await this.saveWithSession(submodel, options);
    } else {
      const session = await this.connection.startSession();
      try {
        await session.withTransaction(async () => {
          await this.saveWithSession(submodel, { ...options, session });
        });
      } finally {
        await session.endSession();
      }
    }
  }

  async findOneOrFail(id: string): Promise<Submodel> {
    return await findOneOrFail(id, this.submodelDoc, this.fromPlain);
  }

  async deleteById(id: string, options?: DbSessionOptions): Promise<void> {
    await this.submodelDoc.findByIdAndDelete(id, options);
  }

  async findOne(id: string): Promise<Submodel | undefined> {
    return await findOne(id, this.submodelDoc, this.fromPlain);
  }

  async findByIds(ids: string[]): Promise<Map<string, Submodel>> {
    return await findByIds(ids, this.submodelDoc, this.fromPlain);
  }
}
