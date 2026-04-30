import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { DbSessionOptions } from "../../database/query-options";
import { findOne, findOneOrFail } from "../../lib/repositories";
import { ActivityDoc, ActivityDocVersion } from "./activity.schema";
import { ActivityHeaderSchema, IActivity, parseActivity } from "../activity-event";
import { decodeCursor, encodeCursor, Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";

@Injectable()
export class ActivityRepository {
  private activityDoc: MongooseModel<ActivityDoc>;

  constructor(
    @InjectModel(ActivityDoc.name)
    passportDoc: MongooseModel<ActivityDoc>,
  ) {
    this.activityDoc = passportDoc;
  }

  async fromPlain(plain: any) {
    const header = ActivityHeaderSchema.parse(plain);
    return parseActivity({ header, payload: plain.payload });
  }

  async createMany(activities: IActivity[], options?: DbSessionOptions) {
    await this.activityDoc.insertMany(
      activities.map(
        (activity) => ({
          ...activity.toDatabase(),
          _schemaVersion: ActivityDocVersion.v1_0_0,
        }),
        { ...options, ordered: false },
      ),
    );
  }

  async findByAggregateId(
    aggregateId: string,
    options?: { pagination?: Pagination },
  ): Promise<PagingResult<IActivity>> {
    const tmpPagination = options?.pagination ?? Pagination.create({ limit: 100 });

    const documents = await this.activityDoc
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
    return PagingResult.create<IActivity>({ pagination: tmpPagination, items: domainObjects });
  }

  async findOneOrFail(id: string): Promise<IActivity> {
    return await findOneOrFail(id, this.activityDoc, this.fromPlain.bind(this));
  }

  async findOne(id: string): Promise<IActivity | undefined> {
    return await findOne(id, this.activityDoc, this.fromPlain.bind(this));
  }
}
