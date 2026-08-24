import type { Auth } from "better-auth";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { findPageByCursor } from "../../../lib/repositories";
import { Pagination } from "../../../pagination/pagination";
import { PagingResult } from "../../../pagination/paging-result";
import type { BetterAuthHeaders } from "../../auth/domain/better-auth-headers";
import { AUTH } from "../../auth/auth.provider";
import { idFilter } from "../../lib/better-auth-id";
import { ApiKey } from "../domain/api-key";
import { ApiKeyMapper, RawApiKey } from "./mappers/api-key.mapper";
import { ApiKeyDoc } from "./schemas/api-key.schema";

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
    const doc = await this.apiKeyModel.findOne({
      _id: idFilter(id),
      referenceId: idFilter(userId),
    });
    if (!doc) return null;
    return ApiKeyMapper.toDomain(doc.toObject() as RawApiKey);
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
