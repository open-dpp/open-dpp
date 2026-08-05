import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BulkImportRunStatusDto, type BulkImportRunStatusDtoType } from "@open-dpp/dto";
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
    options?: { pagination?: Pagination; filter?: { status?: BulkImportRunStatusDtoType[] } },
  ): Promise<PagingResult<BulkImportRun>> {
    const tmpPagination = options?.pagination ?? Pagination.create({ limit: 100 });
    const query: Record<string, unknown> = { bulkImportConfigId };
    if (options?.filter?.status?.length) {
      query.status = { $in: options.filter.status };
    }
    if (tmpPagination.cursor) {
      query.$or = [
        { createdAt: { $lt: decodeCursor(tmpPagination.cursor).createdAt } },
        {
          createdAt: decodeCursor(tmpPagination.cursor).createdAt,
          _id: { $lt: decodeCursor(tmpPagination.cursor).id },
        },
      ];
    }
    const mongooseQuery = this.bulkImportRunDoc.find(query).sort({ createdAt: -1, _id: -1 });
    if (tmpPagination.limit !== null) {
      mongooseQuery.limit(tmpPagination.limit ?? 100);
    }
    const docs = await mongooseQuery.exec();
    const runs = await Promise.all(
      docs.map((doc) => convertToDomain(doc, this.fromPlain.bind(this))),
    );
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

  /** Returns the ids of the deleted runs, so the caller can cascade-delete their items. */
  async deleteAllByBulkImportConfigId(
    bulkImportConfigId: string,
    options?: DbSessionOptions,
  ): Promise<string[]> {
    const docs = await this.bulkImportRunDoc
      .find({ bulkImportConfigId }, { _id: 1 })
      .session(options?.session ?? null)
      .exec();
    const runIds = docs.map((doc) => doc._id as string);
    await this.bulkImportRunDoc.deleteMany({ bulkImportConfigId }, { session: options?.session });
    return runIds;
  }
}
