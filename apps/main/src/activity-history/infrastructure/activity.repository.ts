import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { DbSessionOptions } from "../../database/query-options";
import { findOne, findOneOrFail } from "../../lib/repositories";
import { ActivityDoc, ActivityDocVersion } from "./activity.schema";
import { ActivityHeaderSchema, IActivity, parseActivity } from "../activity-event";
import { decodeCursor, encodeCursor, Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { Period } from "../../time/period";

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
    options?: { pagination?: Pagination; period?: Period; ascending?: boolean },
  ): Promise<PagingResult<IActivity>> {
    const tmpPagination = options?.pagination ?? Pagination.create({ limit: 100 });
    const period = options?.period ?? Period.create({ end: new Date() });
    const ascending = options?.ascending ?? false;
    const sortDirection = ascending ? 1 : -1;
    const cursorOperator = ascending ? "$gt" : "$lt";

    const periodFilter = {
      createdAt: {
        ...(period.start && { $gte: period.start }),
        ...(period.end && { $lte: period.end }),
      },
    };

    const decodedCursor = tmpPagination.cursor ? decodeCursor(tmpPagination.cursor) : undefined;
    const cursorFilter = decodedCursor
      ? {
          $or: [
            { createdAt: { [cursorOperator]: decodedCursor.createdAt } },
            {
              createdAt: decodedCursor.createdAt,
              id: { [cursorOperator]: decodedCursor.id },
            },
          ],
        }
      : undefined;

    const documents = await this.activityDoc
      .find({
        aggregateId,
        ...(periodFilter || cursorFilter
          ? {
              $and: [periodFilter, cursorFilter].filter((f) => f !== undefined),
            }
          : {}),
      })
      .sort({ createdAt: sortDirection, id: sortDirection })
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
