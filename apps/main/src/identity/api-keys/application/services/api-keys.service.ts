import { Injectable } from "@nestjs/common";
import type { CreateApiKeyDto } from "@open-dpp/dto";
import { ForbiddenError, NotFoundError, ValueError } from "@open-dpp/exception";
import { APIError } from "better-auth";
import { Pagination } from "../../../../pagination/pagination";
import { PagingResult } from "../../../../pagination/paging-result";
import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";
import { ApiKey } from "../../domain/api-key";
import { ApiKeysRepository } from "../../infrastructure/api-keys.repository";

const SECONDS_PER_DAY = 24 * 60 * 60;

// Better-auth's APIError carries an HTTP status; surface it as a domain error
// instead of letting it bubble up as an opaque 500. The structural cast works
// around the duplicate better-call types (see auth.provider.ts).
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
export class ApiKeysService {
  constructor(private readonly apiKeysRepository: ApiKeysRepository) {}

  async list(userId: string, pagination: Pagination): Promise<PagingResult<ApiKey>> {
    return this.apiKeysRepository.findPageByUserId(userId, pagination);
  }

  async create(
    data: CreateApiKeyDto,
    headers: BetterAuthHeaders,
  ): Promise<{ apiKey: ApiKey; key: string }> {
    try {
      return await this.apiKeysRepository.create(
        {
          name: data.name,
          expiresInSeconds: data.expiresInDays ? data.expiresInDays * SECONDS_PER_DAY : null,
        },
        headers,
      );
    } catch (error) {
      rethrowAsDomainError(error);
    }
  }

  async rename(
    userId: string,
    keyId: string,
    name: string,
    headers: BetterAuthHeaders,
  ): Promise<ApiKey> {
    const apiKey = await this.findOwnedApiKeyOrFail(userId, keyId);
    try {
      return await this.apiKeysRepository.update(apiKey.withName(name), headers);
    } catch (error) {
      rethrowAsDomainError(error);
    }
  }

  async revoke(userId: string, keyId: string, headers: BetterAuthHeaders): Promise<void> {
    const apiKey = await this.findOwnedApiKeyOrFail(userId, keyId);
    try {
      await this.apiKeysRepository.delete(apiKey.id, headers);
    } catch (error) {
      rethrowAsDomainError(error);
    }
  }

  private async findOwnedApiKeyOrFail(userId: string, keyId: string): Promise<ApiKey> {
    const apiKey = await this.apiKeysRepository.findOneByIdAndUserId(keyId, userId);
    if (!apiKey) {
      throw new NotFoundError(ApiKey.name, keyId);
    }
    return apiKey;
  }
}
