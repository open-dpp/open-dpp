import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  type PermalinkKindType,
  type UniqueProductIdentifierListItemDto,
  UniqueProductIdentifierType,
  UpdateGs1UniqueProductIdentifierRequest,
} from "@open-dpp/dto";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { PassportRepository } from "../../../passports/infrastructure/passport.repository";
import { BaseUrlResolver } from "../../../permalink/application/services/base-url-resolver.service";
import { PermalinkApplicationService } from "../../../permalink/application/services/permalink.application.service";
import { isDuplicateKeyError } from "../../../lib/mongo-errors";
import { Pagination } from "../../../pagination/pagination";
import { UniqueProductIdentifier } from "../../domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../../infrastructure/unique-product-identifier.repository";

export interface CreateGs1UpiInput {
  referenceId: string;
  gtin: string;
  batch?: string | null;
  serial?: string | null;
  organizationId: string;
}

@Injectable()
export class UpiCollectionService {
  constructor(
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
    private readonly passportRepository: PassportRepository,
    private readonly baseUrlResolver: BaseUrlResolver,
    private readonly permalinkApplicationService: PermalinkApplicationService,
  ) {}

  private async loadPermalinkSummaries(
    upis: UniqueProductIdentifier[],
    organizationId: string,
  ): Promise<Map<string, { id: string; kind: PermalinkKindType; publicUrl: string }>> {
    return this.permalinkApplicationService.getPermalinkSummariesByUpiIds(
      upis.map((upi) => upi.uuid),
      organizationId,
    );
  }

  private async findOrThrow(uuid: string): Promise<UniqueProductIdentifier> {
    try {
      return await this.uniqueProductIdentifierRepository.findOneOrFail(uuid);
    } catch (error) {
      if (error instanceof NotFoundInDatabaseException) {
        throw new NotFoundException(`UniqueProductIdentifier ${uuid} not found`);
      }
      throw error;
    }
  }

  async get(uuid: string): Promise<UniqueProductIdentifierListItemDto> {
    const upi = await this.findOrThrow(uuid);

    const passport = await this.passportRepository.findOne(upi.referenceId);
    const passportPublished = passport?.isPublished() ?? false;
    const resolverBase = upi.gs1
      ? await this.baseUrlResolver.getResolverBase(upi.organizationId ?? "")
      : undefined;

    return upi.toListItem({ resolverBase, passportPublished });
  }

  async create(input: CreateGs1UpiInput): Promise<UniqueProductIdentifierListItemDto> {
    const passport = await this.passportRepository.findOne(input.referenceId);
    if (!passport) {
      throw new NotFoundException(`Passport ${input.referenceId} not found`);
    }
    if (passport.isArchived()) {
      throw new ConflictException("A GS1 UPI cannot be created for an archived passport");
    }

    const upi = UniqueProductIdentifier.createGs1({
      referenceId: input.referenceId,
      gtin: input.gtin,
      batch: input.batch,
      serial: input.serial,
      organizationId: input.organizationId,
    });

    let saved: UniqueProductIdentifier;
    try {
      saved = await this.uniqueProductIdentifierRepository.save(upi);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(
          "GS1 identity already assigned — this GTIN/batch/serial combination is in use",
        );
      }
      throw error;
    }

    const resolverBase = await this.baseUrlResolver.getResolverBase(input.organizationId);
    return saved.toListItem({ resolverBase, passportPublished: passport.isPublished() });
  }

  async createInternal(input: {
    referenceId: string;
    organizationId: string;
  }): Promise<UniqueProductIdentifierListItemDto> {
    const passport = await this.passportRepository.findOne(input.referenceId);
    if (!passport) {
      throw new NotFoundException(`Passport ${input.referenceId} not found`);
    }
    if (passport.isArchived()) {
      throw new ConflictException("An internal UPI cannot be created for an archived passport");
    }

    const upi = UniqueProductIdentifier.create({
      referenceId: input.referenceId,
      type: UniqueProductIdentifierType.OPEN_DPP_UUID,
      organizationId: input.organizationId,
    });
    const saved = await this.uniqueProductIdentifierRepository.save(upi);

    return saved.toListItem({ passportPublished: passport.isPublished() });
  }

  async update(
    uuid: string,
    input: UpdateGs1UniqueProductIdentifierRequest,
  ): Promise<UniqueProductIdentifierListItemDto> {
    const upi = await this.findOrThrow(uuid);

    if (upi.type !== UniqueProductIdentifierType.GS1) {
      throw new ConflictException(
        "Only GS1 unique product identifiers can be edited; internal identifiers carry no editable data",
      );
    }

    const passport = await this.passportRepository.findOne(upi.referenceId);
    if (!passport) {
      throw new NotFoundException(`Passport ${upi.referenceId} not found`);
    }
    if (!passport.isDraft()) {
      throw new ConflictException(
        "A GS1 UPI can only be updated while the passport is a draft; it is locked once the passport is published",
      );
    }

    const updated = upi.withGs1(input);

    let saved: UniqueProductIdentifier;
    try {
      saved = await this.uniqueProductIdentifierRepository.save(updated);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(
          "GS1 identity already assigned — this GTIN/batch/serial combination is in use",
        );
      }
      throw error;
    }

    const resolverBase = await this.baseUrlResolver.getResolverBase(saved.organizationId ?? "");
    return saved.toListItem({ resolverBase, passportPublished: false });
  }

  async delete(uuid: string): Promise<void> {
    const upi = await this.findOrThrow(uuid);

    const isGs1 = upi.type === UniqueProductIdentifierType.GS1;
    const isInternal = upi.type === UniqueProductIdentifierType.OPEN_DPP_UUID;
    if (!isGs1 && !isInternal) {
      throw new ConflictException(
        "This unique product identifier is read-only and cannot be deleted",
      );
    }

    const passport = await this.passportRepository.findOne(upi.referenceId);
    if (!passport) {
      throw new NotFoundException(`Passport ${upi.referenceId} not found`);
    }
    if (!passport.isDraft()) {
      throw new ConflictException(
        "A unique product identifier can only be deleted while the passport is a draft; it is locked once the passport is published",
      );
    }

    if (isGs1) {
      await this.permalinkApplicationService.deleteGs1LinkForUpi(uuid);
    }

    await this.uniqueProductIdentifierRepository.deleteById(uuid);
  }

  async list(
    organizationId: string,
    pagination?: Pagination,
  ): Promise<{ items: UniqueProductIdentifierListItemDto[]; cursor: string | null }> {
    const pagingResult = await this.uniqueProductIdentifierRepository.findAllByOrganizationId(
      organizationId,
      {
        pagination: {
          limit: pagination?.limit ?? undefined,
          cursor: pagination?.cursor ?? undefined,
        },
      },
    );
    const upis: UniqueProductIdentifier[] = pagingResult.items;
    const cursor = pagingResult.pagination.cursor;

    if (upis.length === 0) {
      return { items: [], cursor };
    }

    const distinctReferenceIds = [...new Set(upis.map((upi) => upi.referenceId))];
    const passportMap = await this.passportRepository.findByIds(distinctReferenceIds);

    const resolverBase = await this.baseUrlResolver.getResolverBase(organizationId);
    const permalinkSummaries = await this.loadPermalinkSummaries(upis, organizationId);

    const items = upis.map((upi) => {
      const passport = passportMap.get(upi.referenceId);
      const passportPublished = passport?.isPublished() ?? false;
      return upi.toListItem({
        resolverBase,
        passportPublished,
        permalink: permalinkSummaries.get(upi.uuid) ?? null,
      });
    });
    return { items, cursor };
  }

  async listByPassport(
    passportId: string,
    pagination?: Pagination,
  ): Promise<{ items: UniqueProductIdentifierListItemDto[]; cursor: string | null }> {
    const pagingResult =
      await this.uniqueProductIdentifierRepository.findAllByReferencedIdPaginated(passportId, {
        pagination: {
          limit: pagination?.limit ?? undefined,
          cursor: pagination?.cursor ?? undefined,
        },
      });
    const upis: UniqueProductIdentifier[] = pagingResult.items;
    const cursor = pagingResult.pagination.cursor;

    if (upis.length === 0) {
      return { items: [], cursor };
    }

    const passport = await this.passportRepository.findOne(passportId);
    const passportPublished = passport?.isPublished() ?? false;
    const organizationId = passport?.organizationId ?? upis[0].organizationId ?? "";
    const resolverBase = await this.baseUrlResolver.getResolverBase(organizationId);
    const permalinkSummaries = await this.loadPermalinkSummaries(upis, organizationId);

    const items = upis.map((upi) =>
      upi.toListItem({
        resolverBase,
        passportPublished,
        permalink: permalinkSummaries.get(upi.uuid) ?? null,
      }),
    );
    return { items, cursor };
  }
}
