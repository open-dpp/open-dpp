import type { Auth } from "better-auth";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Document, Filter } from "mongodb";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { findPageByCursor } from "../../../lib/repositories";
import { Pagination } from "../../../pagination/pagination";
import { PagingResult } from "../../../pagination/paging-result";
import type { BetterAuthHeaders } from "../../auth/domain/better-auth-headers";
import { AUTH } from "../../auth/auth.provider";
import { ApiKey } from "../domain/api-key";
import { ApiKeyMapper, RawApiKey } from "./mappers/api-key.mapper";
import { ApiKeyDoc } from "./schemas/api-key.schema";

// Better-auth stores string ids while its MongoDB adapter may store reference
// fields as ObjectId; this filter matches both forms and the `$eq` wrapper
// guards against NoSQL operator injection (see invitations.repository.ts).
function idFilter(value: string) {
  return ObjectId.isValid(value) ? { $in: [value, new ObjectId(value)] } : { $eq: value };
}

@Injectable()
export class ApiKeysRepository {
  constructor(
    @InjectModel(ApiKeyDoc.name)
    private readonly apiKeyModel: Model<ApiKeyDoc>,
    @Inject(AUTH) private readonly auth: Auth,
  ) {}

  async findPageByUserId(userId: string, pagination: Pagination): Promise<PagingResult<ApiKey>> {
    return findPageByCursor<ApiKey>(
      this.apiKeyModel,
      { referenceId: idFilter(userId) },
      (doc) => ApiKeyMapper.toDomain(doc.toObject() as RawApiKey),
      { pagination },
    );
  }

  async findOneByIdAndUserId(id: string, userId: string): Promise<ApiKey | null> {
    const rawDoc = await this.apiKeyModel.collection.findOne({
      _id: idFilter(id),
      referenceId: idFilter(userId),
    } as unknown as Filter<Document>);
    if (!rawDoc) return null;
    return ApiKeyMapper.toDomain(rawDoc as RawApiKey);
  }

  // Writes go through better-auth so key generation, hashing and the
  // session-derived ownership checks stay there.
  async create(
    data: { name: string; expiresInSeconds: number | null },
    headers: BetterAuthHeaders,
  ): Promise<{ apiKey: ApiKey; key: string }> {
    const created = await (this.auth.api as any).createApiKey({
      headers,
      body: {
        name: data.name,
        expiresIn: data.expiresInSeconds,
      },
    });
    return { apiKey: ApiKeyMapper.toDomain(created), key: created.key };
  }

  async update(apiKey: ApiKey, headers: BetterAuthHeaders): Promise<ApiKey> {
    const updated = await (this.auth.api as any).updateApiKey({
      headers,
      body: {
        keyId: apiKey.id,
        name: apiKey.name,
      },
    });
    return ApiKeyMapper.toDomain(updated);
  }

  async delete(id: string, headers: BetterAuthHeaders): Promise<void> {
    await (this.auth.api as any).deleteApiKey({
      headers,
      body: { keyId: id },
    });
  }
}
