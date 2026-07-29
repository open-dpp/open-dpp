import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { Document, Model as MongooseModel } from "mongoose";
import { ZodObject } from "zod";
import { IConvertableToPlain } from "../aas/domain/convertable-to-plain";
import { IPersistable } from "../aas/domain/persistable";
import { DbSessionOptions } from "../database/query-options";
import { decodeCursor, encodeCursor, Pagination } from "../pagination/pagination";
import { PagingResult } from "../pagination/paging-result";
import { HasCreatedAt } from "./has-created-at";
import {
  DigitalProductDocumentStatus,
  DigitalProductDocumentStatusType,
} from "../digital-product-document/domain/digital-product-document-status";

export async function convertToDomain<T>(
  mongoDoc: Document<string>,
  fromPlain: (plain: unknown) => Promise<T>,
): Promise<T> {
  const plain = mongoDoc.toObject();
  return await fromPlain({ ...plain, id: plain._id });
}

export async function save<T extends Document<string>, V>(
  domainObject: IPersistable,
  docModel: MongooseModel<T>,
  schemaVersion: string,
  fromPlain: (plain: unknown) => Promise<V>,
  ValidationSchema?: ZodObject<any>,
  options?: DbSessionOptions,
): Promise<V> {
  // 1. Try to find an existing document
  let doc = await docModel
    .findOne({ _id: { $eq: domainObject.id } })
    .session(options?.session ?? null);
  // 2. If none exists, create a new discriminator document
  if (!doc) {
    doc = new docModel({
      _id: domainObject.id, // top-level discriminator
    });
  }
  const plain = ValidationSchema
    ? ValidationSchema.parse(domainObject.toPlain())
    : domainObject.toPlain();

  // 3. Modify fields — casting and validation occur on save()
  doc.set({
    _schemaVersion: schemaVersion,
    ...plain,
  });
  return convertToDomain(
    await doc.save({ ...options, validateBeforeSave: true, session: options?.session }),
    fromPlain,
  );
}

export async function findOneOrFail<T extends Document<string>, V>(
  id: string,
  docModel: MongooseModel<T>,
  fromPlain: (plain: unknown) => Promise<V>,
): Promise<V> {
  const domainObject = await findOne(id, docModel as any, fromPlain);
  if (!domainObject) {
    throw new NotFoundInDatabaseException(docModel.modelName);
  }
  return domainObject;
}

export async function findOne<T extends Document<string>, V>(
  id: string,
  docModel: MongooseModel<T>,
  fromPlain: (plain: unknown) => Promise<V>,
): Promise<V | undefined> {
  const mongoDoc = await docModel.findOne({ _id: { $eq: id } });
  if (!mongoDoc) {
    return undefined;
  }
  return convertToDomain(mongoDoc, fromPlain);
}

export async function findByIds<T extends Document<string>, V>(
  ids: string[],
  docModel: MongooseModel<T>,
  fromPlain: (plain: unknown) => Promise<V>,
): Promise<Map<string, V>> {
  const result = new Map<string, V>();
  if (ids.length === 0) return result;
  const mongoDocs = await docModel.find({ _id: { $in: ids } });
  for (const doc of mongoDocs) {
    const domain = await convertToDomain(doc, fromPlain);
    result.set(doc._id as string, domain);
  }
  return result;
}

export type FindOptions = {
  pagination?: Pagination;
  filter?: { status?: ReadonlyArray<DigitalProductDocumentStatusType> };
};

function buildStatusFilter(statuses: ReadonlyArray<DigitalProductDocumentStatusType>) {
  const includesDraft = statuses.includes(DigitalProductDocumentStatus.Draft);
  const currentStatusClause =
    statuses.length === 1
      ? { "lastStatusChange.currentStatus": statuses[0] }
      : { "lastStatusChange.currentStatus": { $in: [...statuses] } };
  return {
    $or: [currentStatusClause, ...(includesDraft ? [{ _schemaVersion: "1.0.0" }] : [])],
  };
}

export async function findAllByOrganizationId<
  T extends Document<string>,
  V extends IPersistable & HasCreatedAt & IConvertableToPlain,
>(
  docModel: MongooseModel<T>,
  fromPlain: (plain: unknown) => Promise<V>,
  organizationId: string,
  options?: FindOptions,
) {
  const tmpPagination = options?.pagination ?? Pagination.create({ limit: 100 });
  const statuses = options?.filter?.status;
  // Base filter without the cursor window: matches the full result set the cursor pages through.
  // Reused for the total count so the count reflects every matching document, not just the page.
  const baseFilter = {
    organizationId,
    ...(statuses && statuses.length > 0 ? buildStatusFilter(statuses) : {}),
  };
  // The cursor window is its own $or. buildStatusFilter also produces a $or, so the two must be
  // combined with $and — spreading both into one object would let the cursor $or overwrite the
  // status $or, silently returning documents of other statuses on paginated requests.
  const decodedCursor = tmpPagination.cursor ? decodeCursor(tmpPagination.cursor) : null;
  const cursorFilter = decodedCursor
    ? {
        $or: [
          { createdAt: { $lt: decodedCursor.createdAt } },
          { createdAt: decodedCursor.createdAt, id: { $lt: decodedCursor.id } },
        ],
      }
    : null;
  const docs = await docModel
    .find(cursorFilter ? { $and: [baseFilter, cursorFilter] } : baseFilter)
    .sort({ createdAt: -1, id: -1 })
    .limit(tmpPagination.limit ?? 100)
    .exec();
  // Counted against the same base filter. Backed by the { organizationId, createdAt } index,
  // so this stays performant even with hundreds of thousands of documents per organization.
  const totalCount = await docModel.countDocuments(baseFilter);
  const domainObjects = await Promise.all(docs.map((d) => convertToDomain(d, fromPlain)));
  if (domainObjects.length > 0) {
    const lastObject = domainObjects[domainObjects.length - 1];
    tmpPagination.setCursor(encodeCursor(lastObject.createdAt.toISOString(), lastObject.id));
  }
  return PagingResult.create<V>({ pagination: tmpPagination, items: domainObjects, totalCount });
}
