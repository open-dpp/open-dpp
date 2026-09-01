import type { Auth } from "better-auth";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ForbiddenError, NotFoundError, ValueError } from "@open-dpp/exception";
import { APIError } from "better-auth";
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

// Better-auth's APIError carries an HTTP status; translate it to a domain error
// at the boundary where it originates instead of letting it bubble up as an
// opaque 500. The structural cast works around the duplicate better-call types
// (see auth.provider.ts).
function rethrowAsDomainError(error: unknown): never {
  if (error instanceof APIError) {
    const { statusCode, body } = error as unknown as {
      statusCode?: number;
      body?: { message?: string };
    };
    if (statusCode === 404) {
      throw new NotFoundError(ApiKey.name);
    }
    if (statusCode === 401) {
      // Better-auth resolves no session from an x-api-key header, so key
      // management deliberately requires a browser session — a leaked key
      // must not be able to mint or revoke keys.
      throw new ForbiddenError("Managing api keys requires a browser session");
    }
    throw new ValueError(body?.message ?? "Invalid api key request");
  }
  throw error;
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
    data: { name: string; expiresInSeconds: number },
    headers: BetterAuthHeaders,
  ): Promise<{ apiKey: ApiKey; key: string }> {
    try {
      const created = await (this.auth.api as any).createApiKey({
        headers,
        body: {
          name: data.name,
          expiresIn: data.expiresInSeconds,
        },
      });
      return { apiKey: ApiKeyMapper.toDomain(created), key: created.key };
    } catch (error) {
      rethrowAsDomainError(error);
    }
  }

  async update(apiKey: ApiKey, headers: BetterAuthHeaders): Promise<ApiKey> {
    try {
      const updated = await (this.auth.api as any).updateApiKey({
        headers,
        body: {
          keyId: apiKey.id,
          name: apiKey.name,
        },
      });
      return ApiKeyMapper.toDomain(updated);
    } catch (error) {
      rethrowAsDomainError(error);
    }
  }

  async delete(id: string, headers: BetterAuthHeaders): Promise<void> {
    try {
      await (this.auth.api as any).deleteApiKey({
        headers,
        body: { keyId: id },
      });
    } catch (error) {
      rethrowAsDomainError(error);
    }
  }
}
