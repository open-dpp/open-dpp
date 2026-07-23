import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BulkImportRunStatusDto } from "@open-dpp/dto";
import { DbSessionOptions } from "../../database/query-options";
import { convertToDomain, findOne, findOneOrFail, save } from "../../lib/repositories";
import { decodeCursor, encodeCursor, Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { BulkImportRun } from "../domain/bulk-import-run";
import { BulkImportRunDoc, BulkImportRunDocVersion } from "./bulk-import-run.schema";

@Injectable()
export class BulkImportRunRepository {
  private bulkImportRunDoc: MongooseModel<BulkImportRunDoc>;

  constructor(
    @InjectModel(BulkImportRunDoc.name)
    bulkImportRunDoc: MongooseModel<BulkImportRunDoc>,
  ) {
    this.bulkImportRunDoc = bulkImportRunDoc;
  }

  async fromPlain(plain: any) {
    return BulkImportRun.fromPlain(plain);
  }

  async save(run: BulkImportRun, options?: DbSessionOptions) {
    return await save(
      run,
      this.bulkImportRunDoc,
      BulkImportRunDocVersion.v1_0_0,
      this.fromPlain.bind(this),
      undefined,
      options,
    );
  }

  async findOneOrFail(id: string) {
    return await findOneOrFail(id, this.bulkImportRunDoc, this.fromPlain.bind(this));
  }

  async findOne(id: string) {
    return await findOne(id, this.bulkImportRunDoc, this.fromPlain.bind(this));
  }

  async findAllByBulkImportConfigId(
    bulkImportConfigId: string,
    pagination?: Pagination,
  ): Promise<PagingResult<BulkImportRun>> {
    const tmpPagination = pagination ?? Pagination.create({ limit: 100 });
    const docs = await this.bulkImportRunDoc
      .find({
        bulkImportConfigId,
        ...(tmpPagination.cursor && {
          $or: [
            { createdAt: { $lt: decodeCursor(tmpPagination.cursor).createdAt } },
            {
              createdAt: decodeCursor(tmpPagination.cursor).createdAt,
              _id: { $lt: decodeCursor(tmpPagination.cursor).id },
            },
          ],
        }),
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(tmpPagination.limit ?? 100)
      .exec();
    const runs = await Promise.all(docs.map((doc) => convertToDomain(doc, this.fromPlain.bind(this))));
    if (runs.length > 0) {
      const lastRun = runs[runs.length - 1];
      tmpPagination.setCursor(encodeCursor(lastRun.createdAt.toISOString(), lastRun.id));
    }
    return PagingResult.create({ pagination: tmpPagination, items: runs });
  }

  async findAllRunning(): Promise<BulkImportRun[]> {
    const docs = await this.bulkImportRunDoc
      .find({ status: { $in: [BulkImportRunStatusDto.Pending, BulkImportRunStatusDto.Running] } })
      .exec();
    return await Promise.all(docs.map((doc) => convertToDomain(doc, this.fromPlain.bind(this))));
  }
}
