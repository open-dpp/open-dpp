import { ReferenceJsonSchema } from "@open-dpp/dto";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { Document, Model as MongooseModel } from "mongoose";
import { ZodObject } from "zod";
import { IConvertableToPlain } from "../aas/domain/convertable-to-plain";
import { decodeCursor, encodeCursor, Pagination } from "../aas/domain/pagination";
import { PagingResult } from "../aas/domain/paging-result";
import { IPersistable } from "../aas/domain/persistable";
import { HasCreatedAt } from "./has-created-at";

export async function convertToDomain<T>(
  mongoDoc: Document<string>,
  fromPlain: (plain: unknown) => T,
): Promise<T> {
  const plain = mongoDoc.toObject();
  if (plain.submodelElements?.[0].semanticId) {
    ReferenceJsonSchema.parse(plain.submodelElements[0].semanticId);
  }
  return fromPlain({ ...plain, id: plain._id });
}

export async function save<T extends Document<string>, V>(domainObject: IPersistable, docModel: MongooseModel<T>, schemaVersion: string, fromPlain: (plain: unknown) => V, ValidationSchema?: ZodObject<any>): Promise<V> {
  // 1. Try to find an existing document
  let doc = await docModel.findById(domainObject.id);
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
  return convertToDomain(await doc.save({ validateBeforeSave: true }), fromPlain);
}

export async function findOneOrFail<T extends Document<string>, V>(id: string, docModel: MongooseModel<T>, fromPlain: (plain: unknown) => V): Promise<V> {
  const domainObject = await findOne(id, docModel, fromPlain);
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

export async function findAllByOrganizationId<T extends Document<string>, V extends IPersistable & HasCreatedAt & IConvertableToPlain>(docModel: MongooseModel<T>, fromPlain: (plain: unknown) => V, organizationId: string, pagination?: Pagination) {
  const tmpPagination = pagination ?? Pagination.create({ limit: 100 });
  const docs = await docModel.find(
    { organizationId, ...(tmpPagination.cursor && { $or: [
      { createdAt: { $lt: decodeCursor(tmpPagination.cursor).createdAt } },
      {
        createdAt: decodeCursor(tmpPagination.cursor).createdAt,
        id: { $lt: decodeCursor(tmpPagination.cursor).id },
      },
    ] }) },
  ).sort({ createdAt: -1, id: -1 }).limit(tmpPagination.limit ?? 100).exec();
  const domainObjects = docs.map(fromPlain);
  if (domainObjects.length > 0) {
    const lastObject = domainObjects[domainObjects.length - 1];
    tmpPagination.setCursor(encodeCursor(lastObject.createdAt.toISOString(), lastObject.id));
  }
  return PagingResult.create({ pagination: tmpPagination, items: domainObjects });
}
