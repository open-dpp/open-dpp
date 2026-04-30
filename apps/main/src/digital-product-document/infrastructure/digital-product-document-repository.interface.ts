import { IPersistable } from "../../aas/domain/persistable";
import { IDigitalProductDocument } from "../domain/digital-product-document";
import { HasCreatedAt } from "../../lib/has-created-at";
import { IDigitalProductDocumentStatusChangeable } from "../domain/digital-product-document-status";
import { DbSessionOptions } from "../../database/query-options";

export type DigitalProductDocumentEntity = IPersistable &
  IDigitalProductDocument &
  HasCreatedAt &
  IDigitalProductDocumentStatusChangeable;

export interface IDigitalProductDocumentRepository<T extends DigitalProductDocumentEntity> {
  save: (document: T, options?: DbSessionOptions) => Promise<T>;
  findOneOrFail: (id: string) => Promise<T>;
  findOne: (id: string) => Promise<T | undefined>;
}
