import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { convertToDomain, findOne, findOneOrFail, save } from "../../lib/repositories";
import { BulkImportRunItem } from "../domain/bulk-import-run-item";
import { BulkImportRunItemDoc, BulkImportRunItemDocVersion } from "./bulk-import-run-item.schema";

@Injectable()
export class BulkImportRunItemRepository {
  private bulkImportRunItemDoc: MongooseModel<BulkImportRunItemDoc>;

  constructor(
    @InjectModel(BulkImportRunItemDoc.name)
    bulkImportRunItemDoc: MongooseModel<BulkImportRunItemDoc>,
  ) {
    this.bulkImportRunItemDoc = bulkImportRunItemDoc;
  }

  async fromPlain(plain: any) {
    return BulkImportRunItem.fromPlain(plain);
  }

  async save(item: BulkImportRunItem, options?: DbSessionOptions) {
    return await save(
      item,
      this.bulkImportRunItemDoc,
      BulkImportRunItemDocVersion.v1_0_0,
      this.fromPlain.bind(this),
      undefined,
      options,
    );
  }

  /** Rows in a run are capped (see BulkImportRunCreateDtoSchema), so a plain bulk insert is fine. */
  async createMany(items: BulkImportRunItem[], options?: DbSessionOptions): Promise<void> {
    if (items.length === 0) {
      return;
    }
    await this.bulkImportRunItemDoc.insertMany(
      items.map((item) => ({
        _id: item.id,
        _schemaVersion: BulkImportRunItemDocVersion.v1_0_0,
        ...item.toPlain(),
      })),
      { session: options?.session },
    );
  }

  async findOneOrFail(id: string) {
    return await findOneOrFail(id, this.bulkImportRunItemDoc, this.fromPlain.bind(this));
  }

  async findOne(id: string) {
    return await findOne(id, this.bulkImportRunItemDoc, this.fromPlain.bind(this));
  }

  /** Rows in a run are capped (see BulkImportRunCreateDtoSchema), so returning the full list is fine. */
  async findAllByRunId(runId: string): Promise<BulkImportRunItem[]> {
    const docs = await this.bulkImportRunItemDoc.find({ runId }).sort({ rowIndex: 1 }).exec();
    return await Promise.all(docs.map((doc) => convertToDomain(doc, this.fromPlain.bind(this))));
  }
}
