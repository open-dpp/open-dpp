import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { Document, Model as MongooseModel } from "mongoose";
import { ZodObject } from "zod";
import { IConvertableToPlain } from "../aas/domain/convertable-to-plain";
import { IPersistable } from "../aas/domain/persistable";
import { DbSessionOptions } from "../database/query-options";
import { decodeCursor, encodeCursor, Pagination } from "../pagination/pagination";
import { PagingResult } from "../pagination/paging-result";
import { HasCreatedAt } from "./has-created-at";

export async function convertToDomain<T>(
  mongoDoc: Document<string>,
  fromPlain: (plain: unknown) => T,
): Promise<T> {
  const plain = mongoDoc.toObject();
  return fromPlain({ ...plain, id: plain._id });
}

export async function save<T extends Document<string>, V>(domainObject: IPersistable, docModel: MongooseModel<T>, schemaVersion: string, fromPlain: (plain: unknown) => V, ValidationSchema?: ZodObject<any>, options?: DbSessionOptions): Promise<V> {
  // 1. Try to find an existing document
  let doc = await docModel.findById(domainObject.id).session(options?.session ?? null);
  // 2. If none exists, create a new discriminator document
  if (!doc) {
    // eslint-disable-next-line new-cap
    doc = new docModel({
      _id: domainObject.id, // top-level discriminator
    });
  }
  const plain = ValidationSchema ? ValidationSchema.parse(domainObject.toPlain()) : domainObject.toPlain();
  // 3. Modify fields — casting and validation occur on save()
  doc.set({
    _schemaVersion: schemaVersion,
    ...plain,
  });
  return convertToDomain(await doc.save({ ...options, validateBeforeSave: true, session: options?.session }), fromPlain);
}

export async function findOneOrFail<T extends Document<string>, V>(id: string, docModel: MongooseModel<T>, fromPlain: (plain: unknown) => V): Promise<V> {
  const domainObject = await findOne(id, docModel as any, fromPlain);
  if (!domainObject) {
    throw new NotFoundInDatabaseException(docModel.modelName);
  }
  return domainObject;
}

export async function findOne<T extends Document<string>, V>(id: string, docModel: MongooseModel<T>, fromPlain: (plain: unknown) => V): Promise<V | undefined> {
  const mongoDoc = await docModel.findById(id);
  if (!mongoDoc) {
    return undefined;
  }
  return convertToDomain(
    mongoDoc,
    fromPlain,
  );
}

export async function findByIds<T extends Document<string>, V>(ids: string[], docModel: MongooseModel<T>, fromPlain: (plain: unknown) => V): Promise<Map<string, V>> {
  const result = new Map<string, V>();
  if (ids.length === 0)
    return result;
  const mongoDocs = await docModel.find({ _id: { $in: ids } });
  for (const doc of mongoDocs) {
    const domain = await convertToDomain(doc, fromPlain);
    result.set(doc._id as string, domain);
  }
  return result;
}

export async function findAllByOrganizationId<T extends Document<string>, V extends IPersistable & HasCreatedAt & IConvertableToPlain>(docModel: MongooseModel<T>, fromPlain: (plain: unknown) => V, organizationId: string, pagination?: Pagination) {
  const tmpPagination = pagination ?? Pagination.create({ limit: 100 });
  const docs = await docModel.find(
    {
      organizationId,
      ...(tmpPagination.cursor && {
        $or: [
          { createdAt: { $lt: decodeCursor(tmpPagination.cursor).createdAt } },
          {
            createdAt: decodeCursor(tmpPagination.cursor).createdAt,
            id: { $lt: decodeCursor(tmpPagination.cursor).id },
          },
        ],
      }),
    },
  ).sort({ createdAt: -1, id: -1 }).limit(tmpPagination.limit ?? 100).exec();
  const domainObjects = docs.map(fromPlain);
  if (domainObjects.length > 0) {
    const lastObject = domainObjects[domainObjects.length - 1];
    tmpPagination.setCursor(encodeCursor(lastObject.createdAt.toISOString(), lastObject.id));
  }
  return PagingResult.create({ pagination: tmpPagination, items: domainObjects });
}
