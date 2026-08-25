import { Injectable } from "@nestjs/common";
import type { CreateApiKeyDto } from "@open-dpp/dto";
import { NotFoundError } from "@open-dpp/exception";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { Pagination } from "../../../../pagination/pagination";
import { PagingResult } from "../../../../pagination/paging-result";
import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";
import { ApiKey } from "../../domain/api-key";
import { ApiKeysRepository } from "../../infrastructure/api-keys.repository";

dayjs.extend(duration);

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
    return this.apiKeysRepository.create(
      {
        name: data.name,
        expiresInSeconds: data.expiresInDays
          ? dayjs.duration(data.expiresInDays, "days").asSeconds()
          : null,
      },
      headers,
    );
  }

  async rename(
    userId: string,
    keyId: string,
    name: string,
    headers: BetterAuthHeaders,
  ): Promise<ApiKey> {
    const apiKey = await this.findOwnedApiKeyOrFail(userId, keyId);
    return this.apiKeysRepository.update(apiKey.withName(name), headers);
  }

  async revoke(userId: string, keyId: string, headers: BetterAuthHeaders): Promise<void> {
    const apiKey = await this.findOwnedApiKeyOrFail(userId, keyId);
    await this.apiKeysRepository.delete(apiKey.id, headers);
  }

  private async findOwnedApiKeyOrFail(userId: string, keyId: string): Promise<ApiKey> {
    const apiKey = await this.apiKeysRepository.findOneByIdAndUserId(keyId, userId);
    if (!apiKey) {
      throw new NotFoundError(ApiKey.name, keyId);
    }
    return apiKey;
  }
}
