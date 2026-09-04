import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { findOne, findOneOrFail, save } from "../../lib/repositories";
import { BulkImportConfig } from "../domain/bulk-import-config";
import { BulkImportConfigDoc, BulkImportConfigDocVersion } from "./bulk-import-config.schema";

@Injectable()
export class BulkImportConfigRepository {
  private bulkImportConfigDoc: MongooseModel<BulkImportConfigDoc>;

  constructor(
    @InjectModel(BulkImportConfigDoc.name)
    bulkImportConfigDoc: MongooseModel<BulkImportConfigDoc>,
  ) {
    this.bulkImportConfigDoc = bulkImportConfigDoc;
  }

  async fromPlain(plain: any) {
    return BulkImportConfig.fromPlain(plain);
  }

  async save(config: BulkImportConfig, options?: DbSessionOptions) {
    return await save(
      config,
      this.bulkImportConfigDoc,
      BulkImportConfigDocVersion.v1_0_0,
      this.fromPlain.bind(this),
      undefined,
      options,
    );
  }

  async findOneOrFail(id: string) {
    return await findOneOrFail(id, this.bulkImportConfigDoc, this.fromPlain.bind(this));
  }

  async findOne(id: string) {
    return await findOne(id, this.bulkImportConfigDoc, this.fromPlain.bind(this));
  }

  async findAllByOrganizationId(
    organizationId: string,
    filter?: { templateId?: string },
  ): Promise<BulkImportConfig[]> {
    const docs = await this.bulkImportConfigDoc
      .find({ organizationId, ...(filter?.templateId ? { templateId: filter.templateId } : {}) })
      .sort({ createdAt: -1 })
      .exec();
    return await Promise.all(docs.map((doc) => this.fromPlain({ ...doc.toObject(), id: doc._id })));
  }

  async findAllByTemplateId(templateId: string): Promise<BulkImportConfig[]> {
    const docs = await this.bulkImportConfigDoc.find({ templateId }).exec();
    return await Promise.all(docs.map((doc) => this.fromPlain({ ...doc.toObject(), id: doc._id })));
  }

  async deleteById(id: string, options?: DbSessionOptions): Promise<void> {
    await this.bulkImportConfigDoc.findByIdAndDelete(id, { session: options?.session });
  }

  async deleteAllByTemplateId(templateId: string, options?: DbSessionOptions): Promise<void> {
    await this.bulkImportConfigDoc.deleteMany({ templateId }, { session: options?.session });
  }
}
