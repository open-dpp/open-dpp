import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { DbSessionOptions } from "../../database/query-options";
import { findPageByCursor } from "../../lib/repositories";
import { Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { canonicalGs1Value, UniqueProductIdentifier } from "../domain/unique.product.identifier";
import { UniqueProductIdentifierType, type UniqueProductIdentifierTypeValue } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import {
  type IdentifierPart,
  UniqueProductIdentifierDoc,
  UniqueProductIdentifierSchemaVersion,
} from "./unique-product-identifier.schema";

const GS1_PART_KEYS = ["gtin", "batch", "serial"] as const;

function toParts(plain: {
  gtin: string | null;
  batch: string | null;
  serial: string | null;
}): Pick<IdentifierPart, "key" | "value">[] | undefined {
  if (plain.gtin === null) {
    return undefined;
  }
  return GS1_PART_KEYS.flatMap((key) => {
    const value = plain[key];
    return value === null ? [] : [{ key, value }];
  });
}

function partValue(parts: IdentifierPart[] | undefined, key: string): string | null {
  return parts?.find((part) => part.key === key)?.value ?? null;
}

@Injectable()
export class UniqueProductIdentifierRepository {
  private readonly uniqueProductIdentifierDoc: MongooseModel<UniqueProductIdentifierDoc>;

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
      gtin: partValue(uniqueProductIdentifierDoc.parts, "gtin"),
      batch: partValue(uniqueProductIdentifierDoc.parts, "batch"),
      serial: partValue(uniqueProductIdentifierDoc.parts, "serial"),
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
        value: uniqueProductIdentifier.canonicalValue,
        parts: toParts(plain),
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

  async findByIds(uuids: string[]): Promise<UniqueProductIdentifier[]> {
    if (uuids.length === 0) return [];
    const docs = await this.uniqueProductIdentifierDoc.find({ _id: { $in: uuids } });
    return docs.map((doc) => this.convertToDomain(doc));
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

  async findByReferenceIdAndType(
    referenceId: string,
    type: UniqueProductIdentifierTypeValue,
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

  async findByGs1Key(key: {
    gtin: string;
    batch?: string | null;
    serial?: string | null;
  }): Promise<UniqueProductIdentifier | undefined> {
    let canonicalValue: string;
    try {
      canonicalValue = canonicalGs1Value(key);
    } catch (error) {
      // An unparseable key can never match a stored canonical value.
      if (error instanceof ValueError) {
        return undefined;
      }
      throw error;
    }
    const doc = await this.uniqueProductIdentifierDoc.findOne({
      type: { $eq: UniqueProductIdentifierType.GS1 },
      value: { $eq: canonicalValue },
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

  async findAllByReferencedIdPaginated(
    referenceId: string,
    options?: { pagination?: { limit?: number; cursor?: string } },
  ): Promise<PagingResult<UniqueProductIdentifier>> {
    return this.findPageByFilter({ referenceId: { $eq: referenceId } }, options);
  }

  async findAllByOrganizationId(
    organizationId: string,
    options?: { pagination?: { limit?: number; cursor?: string } },
  ): Promise<PagingResult<UniqueProductIdentifier>> {
    return this.findPageByFilter({ organizationId: { $eq: organizationId } }, options);
  }

  private findPageByFilter(
    filter: Record<string, unknown>,
    options?: { pagination?: { limit?: number; cursor?: string } },
  ): Promise<PagingResult<UniqueProductIdentifier>> {
    return findPageByCursor(
      this.uniqueProductIdentifierDoc,
      filter,
      (doc) => this.convertToDomain(doc),
      {
        pagination: Pagination.create({
          limit: options?.pagination?.limit ?? 100,
          cursor: options?.pagination?.cursor,
        }),
      },
    );
  }

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
