import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { DbSessionOptions } from "../../database/query-options";
import { decodeCursor, encodeCursor, Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { UniqueProductIdentifier } from "../domain/unique.product.identifier";
import {
  ExternalIdentifierType,
  type ExternalIdentifierTypeValue,
} from "../presentation/dto/unique-product-identifier-dto.schema";
import {
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchemaVersion,
} from "./unique-product-identifier.schema";

@Injectable()
export class UniqueProductIdentifierRepository {
  private uniqueProductIdentifierDoc: MongooseModel<UniqueProductIdentifierDoc>;

  constructor(
    @InjectModel(UniqueProductIdentifierDoc.name)
    uniqueProductIdentifierDoc: MongooseModel<UniqueProductIdentifierDoc>,
  ) {
    this.uniqueProductIdentifierDoc = uniqueProductIdentifierDoc;
  }

  convertToDomain(uniqueProductIdentifierDoc: UniqueProductIdentifierDoc) {
    return UniqueProductIdentifier.loadFromDb({
      uuid: uniqueProductIdentifierDoc._id.toString(),
      referenceId: uniqueProductIdentifierDoc.referenceId,
      type: uniqueProductIdentifierDoc.type ?? null,
      gtin: uniqueProductIdentifierDoc.gtin ?? null,
      batch: uniqueProductIdentifierDoc.batch ?? null,
      serial: uniqueProductIdentifierDoc.serial ?? null,
      organizationId: uniqueProductIdentifierDoc.organizationId ?? null,
    });
  }

  async save(uniqueProductIdentifier: UniqueProductIdentifier, options?: DbSessionOptions) {
    const plain = uniqueProductIdentifier.toPlain();
    const doc = await this.uniqueProductIdentifierDoc.findOneAndUpdate(
      { _id: uniqueProductIdentifier.uuid },
      {
        _schemaVersion: UniqueProductIdentifierSchemaVersion.v1_3_0,
        referenceId: plain.referenceId,
        type: plain.type,
        gtin: plain.gtin,
        batch: plain.batch,
        serial: plain.serial,
        organizationId: plain.organizationId,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        session: options?.session ?? null,
      },
    );
    if (!doc) {
      throw new Error("findOneAndUpdate with upsert did not return a document");
    }
    return this.convertToDomain(doc);
  }

  async findOne(uuid: string) {
    const uniqueProductIdentifierDoc = await this.uniqueProductIdentifierDoc.findById(uuid);
    if (!uniqueProductIdentifierDoc) {
      return undefined;
    }
    return this.convertToDomain(uniqueProductIdentifierDoc);
  }

  async findOneOrFail(uuid: string) {
    const uniqueProductIdentifier = await this.findOne(uuid);
    if (!uniqueProductIdentifier) {
      throw new NotFoundInDatabaseException(UniqueProductIdentifier.name);
    }
    return uniqueProductIdentifier;
  }

  async findOneByReferencedId(referenceId: string) {
    const uniqueProductIdentifierDoc = await this.uniqueProductIdentifierDoc
      .findOne({
        referenceId: {
          $eq: referenceId,
        },
      })
      .sort({ createdAt: -1 });
    if (!uniqueProductIdentifierDoc) {
      return undefined;
    }
    return this.convertToDomain(uniqueProductIdentifierDoc);
  }

  /**
   * Resolve the newest UPI for a passport filtered by external identifier type.
   *
   * Used by the legacy GS1 1:1 identity service (`findByReferenceIdAndType(.., GS1)`).
   * The canonical `OPEN_DPP_UUID` lookup was removed in ADR 0006 (media keys on the
   * passportId; AI chat resolves the passport directly), so this is a plain
   * type-filtered, newest-first lookup. `_id` is a stable secondary key (matching the
   * sibling list queries) so the result is deterministic on a `createdAt` tie.
   */
  async findByReferenceIdAndType(
    referenceId: string,
    type: ExternalIdentifierTypeValue,
  ): Promise<UniqueProductIdentifier | undefined> {
    const doc = await this.uniqueProductIdentifierDoc
      .findOne({
        referenceId: { $eq: referenceId },
        type: { $eq: type },
      })
      .sort({ createdAt: -1, _id: -1 });
    if (!doc) {
      return undefined;
    }
    return this.convertToDomain(doc);
  }

  /**
   * Resolve the GS1 UPI carrying an EXACT assembled key (gtin + optional batch +
   * optional serial). Used by the public resolver to turn a scanned
   * `/01/{gtin}[/10/{batch}][/21/{serial}]` into its passport.
   *
   * The match is on the full key: an absent batch/serial maps to a `null` filter,
   * so a bare-GTIN scan resolves only the bare-GTIN row and never a serialized
   * sibling that shares the GTIN (and vice versa). This mirrors the
   * (gtin, batch, serial) compound unique index.
   */
  async findByGs1Key(key: {
    gtin: string;
    batch?: string | null;
    serial?: string | null;
  }): Promise<UniqueProductIdentifier | undefined> {
    const doc = await this.uniqueProductIdentifierDoc.findOne({
      gtin: { $eq: key.gtin },
      batch: { $eq: key.batch ?? null },
      serial: { $eq: key.serial ?? null },
      type: { $eq: ExternalIdentifierType.GS1 },
    });
    if (!doc) {
      return undefined;
    }
    return this.convertToDomain(doc);
  }

  async findAllByReferencedId(referenceId: string) {
    const uniqueProductIdentifiers = await this.uniqueProductIdentifierDoc.find({
      referenceId: {
        $eq: referenceId,
      },
    });
    return uniqueProductIdentifiers.map((upi) => this.convertToDomain(upi));
  }

  /**
   * List a single passport's UPIs (OPEN_DPP_UUID + GS1), newest-first, with
   * cursor-based pagination. Mirrors `findAllByOrganizationId` but scopes by
   * `referenceId` (the owning passport's uuid) instead of `organizationId`.
   *
   * The cursor is built from the doc's `createdAt + _id` (both descending) so the
   * sort stays stable even when two docs share the same `createdAt` millisecond.
   */
  async findAllByReferencedIdPaginated(
    referenceId: string,
    options?: { pagination?: { limit?: number; cursor?: string } },
  ): Promise<PagingResult<UniqueProductIdentifier>> {
    const pagination = Pagination.create({
      limit: options?.pagination?.limit ?? 100,
      cursor: options?.pagination?.cursor,
    });
    const cursorFilter = pagination.cursor
      ? {
          $or: [
            { createdAt: { $lt: decodeCursor(pagination.cursor).createdAt } },
            {
              createdAt: decodeCursor(pagination.cursor).createdAt,
              _id: { $lt: decodeCursor(pagination.cursor).id },
            },
          ],
        }
      : {};
    const docs = await this.uniqueProductIdentifierDoc
      .find({ referenceId: { $eq: referenceId }, ...cursorFilter })
      .sort({ createdAt: -1, _id: -1 })
      .limit(pagination.limit ?? 100);
    const items = docs.map((doc) => this.convertToDomain(doc));
    if (items.length > 0) {
      const lastDoc = docs[docs.length - 1];
      pagination.setCursor(
        encodeCursor((lastDoc.createdAt as Date).toISOString(), lastDoc._id.toString()),
      );
    }
    return PagingResult.create<UniqueProductIdentifier>({ pagination, items });
  }

  /**
   * List all UPIs for an organisation, newest-first, with cursor-based pagination.
   *
   * Mirrors `activity.repository.ts findByAggregateId`. The cursor is built from
   * the doc's `createdAt + _id` (both descending) so that the sort is stable even
   * when two docs share the same `createdAt` millisecond.
   */
  async findAllByOrganizationId(
    organizationId: string,
    options?: { pagination?: { limit?: number; cursor?: string } },
  ): Promise<PagingResult<UniqueProductIdentifier>> {
    const pagination = Pagination.create({
      limit: options?.pagination?.limit ?? 100,
      cursor: options?.pagination?.cursor,
    });
    const cursorFilter = pagination.cursor
      ? {
          $or: [
            { createdAt: { $lt: decodeCursor(pagination.cursor).createdAt } },
            {
              createdAt: decodeCursor(pagination.cursor).createdAt,
              _id: { $lt: decodeCursor(pagination.cursor).id },
            },
          ],
        }
      : {};
    const docs = await this.uniqueProductIdentifierDoc
      .find({ organizationId: { $eq: organizationId }, ...cursorFilter })
      .sort({ createdAt: -1, _id: -1 })
      .limit(pagination.limit ?? 100);
    const items = docs.map((doc) => this.convertToDomain(doc));
    if (items.length > 0) {
      const lastDoc = docs[docs.length - 1];
      pagination.setCursor(
        encodeCursor((lastDoc.createdAt as Date).toISOString(), lastDoc._id.toString()),
      );
    }
    return PagingResult.create<UniqueProductIdentifier>({ pagination, items });
  }

  /**
   * Delete a single UPI by its uuid.
   *
   * Single-id scoped so that deleting one GS1 UPI never touches sibling UPIs
   * for the same passport (e.g. the canonical OPEN_DPP_UUID row). A no-op for
   * an unknown uuid.
   */
  async deleteById(uuid: string, options?: DbSessionOptions) {
    await this.uniqueProductIdentifierDoc.findByIdAndDelete(uuid, {
      session: options?.session ?? null,
    });
  }

  async deleteByReferenceId(referenceId: string, options?: DbSessionOptions) {
    await this.uniqueProductIdentifierDoc.deleteMany(
      { referenceId },
      { session: options?.session },
    );
  }
}
