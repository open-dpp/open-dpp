import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { convertToDomain, findOne, findOneOrFail, save } from "../../lib/repositories";
import { Pagination } from "../../pagination/pagination";
import { decodeRowIndexCursor, encodeRowIndexCursor } from "../../pagination/pagination";
import { BulkImportRunItem } from "../domain/bulk-import-run-item";
import { BulkImportRunItemDoc, BulkImportRunItemDocVersion } from "./bulk-import-run-item.schema";
import { PagingResult } from "../../pagination/paging-result";

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

  /**
   * Finds all items for a run, optionally paginated.
   * Items are sorted by rowIndex then _id for consistent cursor-based pagination.
   */
  async findAllByRunId(
    runId: string,
    pagination?: Pagination,
  ): Promise<PagingResult<BulkImportRunItem>> {
    const tmpPagination = pagination ?? Pagination.create({ limit: 100 });
    const query: Record<string, unknown> = { runId };

    if (tmpPagination.cursor) {
      const { rowIndex, id } = decodeRowIndexCursor(tmpPagination.cursor);
      query.$or = [{ rowIndex: { $gt: rowIndex } }, { rowIndex, _id: { $gt: id } }];
    }

    const mongooseQuery = this.bulkImportRunItemDoc.find(query).sort({ rowIndex: 1, _id: 1 });

    if (tmpPagination.limit !== null) {
      mongooseQuery.limit(tmpPagination.limit);
    }

    const docs = await mongooseQuery.exec();
    const items = await Promise.all(
      docs.map((doc) => convertToDomain(doc, this.fromPlain.bind(this))),
    );

    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      tmpPagination.setCursor(encodeRowIndexCursor(lastItem.rowIndex, lastItem.id));
    }

    return PagingResult.create({ pagination: tmpPagination, items });
  }

  async deleteAllByRunIds(runIds: string[], options?: DbSessionOptions): Promise<void> {
    if (runIds.length === 0) {
      return;
    }
    await this.bulkImportRunItemDoc.deleteMany(
      { runId: { $in: runIds } },
      { session: options?.session },
    );
  }
}
