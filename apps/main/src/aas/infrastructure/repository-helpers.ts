import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { Document, Model as MongooseModel } from "mongoose";
import { IPersistable } from "../domain/persistable";

export async function convertToDomain<T>(
  mongoDoc: Document,
  fromPlain: (plain: unknown) => T,
): Promise<T> {
  const plain = mongoDoc.toObject();
  return fromPlain({ ...plain, id: plain._id });
}

export async function save<T, V>(domainObject: IPersistable, docModel: MongooseModel<T>, schemaVersion: string, fromPlain: (plain: unknown) => V): Promise<V> {
  // 1. Try to find an existing document
  let doc = await docModel.findById(domainObject.id);

  // 2. If none exists, create a new discriminator document
  if (!doc) {
    // eslint-disable-next-line new-cap
    doc = new docModel({
      _id: domainObject.id, // top-level discriminator
    });
  }
  const plain = domainObject.toPlain();
  // 3. Modify fields — casting and validation occur on save()
  doc.set({
    _schemaVersion: schemaVersion,
    ...plain,
  });
  return convertToDomain(await doc.save({ validateBeforeSave: true }), fromPlain);
}

export async function findOneOrFail<T, V>(id: string, docModel: MongooseModel<T>, fromPlain: (plain: unknown) => V): Promise<V> {
  const domainObject = await findOne(id, docModel, fromPlain);
  if (!domainObject) {
    throw new NotFoundInDatabaseException(docModel.modelName);
  }
  return domainObject;
}

export async function findOne<T, V>(id: string, docModel: MongooseModel<T>, fromPlain: (plain: unknown) => V): Promise<V | undefined> {
  const mongoDoc = await docModel.findById(id);
  if (!mongoDoc) {
    return undefined;
  }
  return convertToDomain(
    mongoDoc,
    fromPlain,
  );
}
