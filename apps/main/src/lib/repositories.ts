import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { ClientSession, Document, Model as MongooseModel } from "mongoose";
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

export type CursorPageOptions = {
  pagination?: Pagination;
  session?: ClientSession | null;
};

/**
 * Newest-first, cursor-paginated `.find()` shared by every org/passport-scoped
 * list. The cursor is `createdAt + _id` (both descending) so the sort stays
 * stable across a `createdAt` tie — every collection stores its uuid as `_id`;
 * none has a stored `id` path. `filter` is the non-cursor scope
 * (`{ organizationId }`, `{ referenceId }`, …); the cursor clause is appended.
 *
 * The returned cursor is `null` on the last page — the documented contract
 * (`PagingMetadataDtoSchema`) consumers page against. One extra doc is fetched
 * purely to learn whether a next page exists; it is never returned.
 */
export async function findPageByCursor<V extends IConvertableToPlain>(
  docModel: MongooseModel<any>,
  filter: Record<string, unknown>,
  convert: (doc: any) => V | Promise<V>,
  options?: CursorPageOptions,
): Promise<PagingResult<V>> {
  const pagination = options?.pagination ?? Pagination.create({ limit: 100 });
  const cursor = pagination.cursor ? decodeCursor(pagination.cursor) : null;
  const cursorFilter = cursor
    ? {
        $or: [
          { createdAt: { $lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
        ],
      }
    : {};
  const limit = pagination.limit ?? 100;
  const fetched = await docModel
    .find({ ...filter, ...cursorFilter } as Record<string, unknown>)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .session(options?.session ?? null)
    .exec();
  const hasNextPage = fetched.length > limit;
  const docs = hasNextPage ? fetched.slice(0, limit) : fetched;
  const items = await Promise.all(docs.map((doc) => convert(doc)));
  const last = docs[docs.length - 1];
  pagination.setCursor(
    hasNextPage && last
      ? encodeCursor((last.get("createdAt") as Date).toISOString(), String(last._id))
      : null,
  );
  return PagingResult.create<V>({ pagination, items });
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
  const statuses = options?.filter?.status;
  const filter = {
    organizationId,
    ...(statuses && statuses.length > 0 ? buildStatusFilter(statuses) : {}),
  };
  return findPageByCursor<V>(docModel, filter, (d) => convertToDomain(d, fromPlain), {
    pagination: options?.pagination,
  });
}
