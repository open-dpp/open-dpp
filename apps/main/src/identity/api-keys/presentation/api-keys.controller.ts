import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import type {
  ApiKeyDto,
  ApiKeyPaginationDto,
  CreateApiKeyDto,
  CreatedApiKeyDto,
  UpdateApiKeyDto,
} from "@open-dpp/dto";
import {
  ApiKeyPaginationDtoSchema,
  CreateApiKeyDtoSchema,
  UpdateApiKeyDtoSchema,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { CursorQueryParam } from "../../../aas/presentation/aas.decorators";
import { LimitQueryParam } from "../../../digital-product-document/presentation/digital-product-document-decorators";
import { Pagination } from "../../../pagination/pagination";
import { extractBetterAuthHeaders } from "../../auth/domain/better-auth-headers";
import type { Session } from "../../auth/domain/session";
import { AuthSession } from "../../auth/presentation/decorators/auth-session.decorator";
import { DenyApiKeyAuth } from "../../auth/presentation/decorators/deny-api-key-auth.decorator";
import { ApiKeysService } from "../application/services/api-keys.service";
import { ApiKeyMapper } from "../infrastructure/mappers/api-key.mapper";

@DenyApiKeyAuth()
@Controller("users/me/api-keys")
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async list(
    @AuthSession() session: Session,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
  ): Promise<ApiKeyPaginationDto> {
    const pagination = Pagination.create({ limit, cursor });
    const page = await this.apiKeysService.list(session.userId, pagination);
    return ApiKeyPaginationDtoSchema.parse({
      paging_metadata: { cursor: page.pagination.cursor },
      result: page.items.map((apiKey) => ApiKeyMapper.toDto(apiKey)),
    });
  }

  @Post()
  async create(
    @Headers() headers: Record<string, string>,
    @Body(new ZodValidationPipe(CreateApiKeyDtoSchema)) body: CreateApiKeyDto,
  ): Promise<CreatedApiKeyDto> {
    const { apiKey, key } = await this.apiKeysService.create(
      body,
      extractBetterAuthHeaders(headers),
    );
    return { ...ApiKeyMapper.toDto(apiKey), key };
  }

  @Patch(":id")
  async update(
    @AuthSession() session: Session,
    @Headers() headers: Record<string, string>,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateApiKeyDtoSchema)) body: UpdateApiKeyDto,
  ): Promise<ApiKeyDto> {
    const apiKey = await this.apiKeysService.rename(
      session.userId,
      id,
      body.name,
      extractBetterAuthHeaders(headers),
    );
    return ApiKeyMapper.toDto(apiKey);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @AuthSession() session: Session,
    @Headers() headers: Record<string, string>,
    @Param("id") id: string,
  ): Promise<void> {
    await this.apiKeysService.revoke(session.userId, id, extractBetterAuthHeaders(headers));
  }
}
