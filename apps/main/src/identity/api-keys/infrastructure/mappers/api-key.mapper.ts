import type { ApiKeyDto } from "@open-dpp/dto";
import { ApiKey } from "../../domain/api-key";

/**
 * Raw shape shared by better-auth api responses and `apikey` collection
 * documents: ids may be strings or ObjectId, so they are normalized here.
 */
export interface RawApiKey {
  id?: unknown;
  _id?: unknown;
  name?: unknown;
  start?: unknown;
  referenceId?: unknown;
  expiresAt?: unknown;
  lastRequest?: unknown;
  createdAt?: unknown;
}

function toDateOrNull(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  return null;
}

export class ApiKeyMapper {
  static toDomain(raw: RawApiKey): ApiKey {
    const createdAt = toDateOrNull(raw.createdAt);
    if (!createdAt) {
      throw new Error("Api key document is missing createdAt");
    }
    return ApiKey.loadFromDb({
      id: String(raw.id ?? raw._id),
      name: typeof raw.name === "string" ? raw.name : "",
      userId: String(raw.referenceId ?? ""),
      start: typeof raw.start === "string" ? raw.start : null,
      expiresAt: toDateOrNull(raw.expiresAt),
      lastUsedAt: toDateOrNull(raw.lastRequest),
      createdAt,
    });
  }

  static toDto(apiKey: ApiKey): ApiKeyDto {
    return {
      id: apiKey.id,
      name: apiKey.name,
      start: apiKey.start,
      expiresAt: apiKey.expiresAt ? apiKey.expiresAt.toISOString() : null,
      lastUsedAt: apiKey.lastUsedAt ? apiKey.lastUsedAt.toISOString() : null,
      createdAt: apiKey.createdAt.toISOString(),
    };
  }
}
