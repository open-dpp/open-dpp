import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  type Gs1IdentityResponse,
  type UniqueProductIdentifierListItemDto,
  UpdateGs1UniqueProductIdentifierRequest,
} from "@open-dpp/dto";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { PassportRepository } from "../../../passports/infrastructure/passport.repository";
import { isDuplicateKeyError } from "../../../lib/mongo-errors";
import { Pagination } from "../../../pagination/pagination";
import { UniqueProductIdentifier } from "../../domain/unique.product.identifier";
import { UniqueProductIdentifierRepository } from "../../infrastructure/unique-product-identifier.repository";
import { ExternalIdentifierType } from "../../presentation/dto/unique-product-identifier-dto.schema";
import { Gs1ResolverBaseService } from "./gs1-resolver-base.service";

export interface CreateGs1UpiInput {
  referenceId: string;
  gtin: string;
  batch?: string | null;
  serial?: string | null;
  organizationId: string;
}

/**
 * Application service for the many-per-passport GS1 UPI collection.
 *
 * Owns the GS1 UPI write path: create a new GS1 UPI for a DRAFT passport.
 * Create / edit / delete of a GS1 UPI is allowed only while the referenced
 * passport is a draft; locked once published (mirrors `loadDraftPassportForWrite`
 * in the legacy identity controller).
 *
 * The many-per-passport model means we do NOT pre-check by `referenceId` before
 * creating; the DB partial-unique-key index is the backstop for duplicate-key 409s.
 */
@Injectable()
export class UpiCollectionService {
  constructor(
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
    private readonly passportRepository: PassportRepository,
    private readonly gs1ResolverBaseService: Gs1ResolverBaseService,
  ) {}

  /**
   * Fetch a single UPI by its uuid and assemble its list-item response shape.
   *
   * Looks up the owning passport's published state so the caller can present the
   * correct read-only flag. The ownership check itself is the controller's
   * responsibility (call `passportService.loadDigitalProductDocumentAndCheckOwnership`
   * with the returned `referenceId`).
   *
   * @throws NotFoundException when the UPI does not exist.
   */
  async get(uuid: string): Promise<UniqueProductIdentifierListItemDto> {
    let upi: UniqueProductIdentifier;
    try {
      upi = await this.uniqueProductIdentifierRepository.findOneOrFail(uuid);
    } catch (error) {
      if (error instanceof NotFoundInDatabaseException) {
        throw new NotFoundException(`UniqueProductIdentifier ${uuid} not found`);
      }
      throw error;
    }

    const passport = await this.passportRepository.findOne(upi.referenceId);
    const passportPublished = passport?.isPublished() ?? false;
    const resolverBase = upi.gs1
      ? await this.gs1ResolverBaseService.getResolverBase(upi.organizationId ?? "")
      : undefined;

    return upi.toListItem({ resolverBase, passportPublished });
  }

  /**
   * Create a new GS1 UPI for a DRAFT passport.
   *
   * @throws NotFoundException when the passport does not exist.
   * @throws ConflictException when the passport is published (lifecycle freeze).
   * @throws ConflictException when `repo.save` encounters a duplicate GS1 key (DB index).
   * @throws ValueError when the GTIN, batch, or serial is invalid (domain validation).
   */
  async create(input: CreateGs1UpiInput): Promise<Gs1IdentityResponse> {
    const passport = await this.passportRepository.findOne(input.referenceId);
    if (!passport) {
      throw new NotFoundException(`Passport ${input.referenceId} not found`);
    }
    if (!passport.isDraft()) {
      throw new ConflictException(
        "A GS1 UPI can only be created while the passport is a draft; it is locked once the passport is published",
      );
    }

    // Throws ValueError for an invalid GTIN, batch, or serial — let it propagate.
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

    const resolverBase = await this.gs1ResolverBaseService.getResolverBase(input.organizationId);
    return {
      uuid: saved.uuid,
      referenceId: saved.referenceId,
      gtin: saved.gs1!.gtin,
      batch: saved.gs1!.batch ?? null,
      serial: saved.gs1!.serial ?? null,
      digitalLink: saved.buildDigitalLink(resolverBase),
    };
  }

  /**
   * Create a new internal (`OPEN_DPP_UUID`) UPI for a DRAFT passport.
   *
   * An internal UPI carries no external identity data — the server mints its `uuid`.
   * Internal UPIs are freely deletable while the passport is a draft (ADR 0006: there
   * is no canonical/auto-minted internal row anymore).
   *
   * @throws NotFoundException when the passport does not exist.
   * @throws ConflictException when the passport is published (lifecycle freeze).
   */
  async createInternal(input: {
    referenceId: string;
    organizationId: string;
  }): Promise<UniqueProductIdentifierListItemDto> {
    const passport = await this.passportRepository.findOne(input.referenceId);
    if (!passport) {
      throw new NotFoundException(`Passport ${input.referenceId} not found`);
    }
    if (!passport.isDraft()) {
      throw new ConflictException(
        "An internal UPI can only be created while the passport is a draft; it is locked once the passport is published",
      );
    }

    const upi = UniqueProductIdentifier.create({
      referenceId: input.referenceId,
      type: ExternalIdentifierType.OPEN_DPP_UUID,
      organizationId: input.organizationId,
    });
    const saved = await this.uniqueProductIdentifierRepository.save(upi);

    return saved.toListItem({ passportPublished: false });
  }

  /**
   * Update the GS1 identity of an existing GS1 UPI, but only while the
   * referenced passport is a draft.
   *
   * Update is GS1-only: internal UPIs carry no editable data, so any non-GS1 row
   * is rejected with 409. See ADR 0005.
   *
   * @throws NotFoundException when the UPI does not exist.
   * @throws ConflictException when the UPI is not a GS1 row (nothing to edit).
   * @throws ConflictException when the passport is published (lifecycle freeze).
   * @throws ConflictException when the update would create a duplicate GS1 key.
   * @throws ValueError when the GTIN, batch, or serial is invalid (domain validation).
   */
  async update(
    uuid: string,
    input: UpdateGs1UniqueProductIdentifierRequest,
  ): Promise<Gs1IdentityResponse> {
    let upi: UniqueProductIdentifier;
    try {
      upi = await this.uniqueProductIdentifierRepository.findOneOrFail(uuid);
    } catch (error) {
      if (error instanceof NotFoundInDatabaseException) {
        throw new NotFoundException(`UniqueProductIdentifier ${uuid} not found`);
      }
      throw error;
    }

    // Only GS1 UPIs carry editable data; internal/system rows have none.
    if (upi.type !== ExternalIdentifierType.GS1) {
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

    // Throws ValueError for an invalid GTIN, batch, or serial — let it propagate.
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

    const resolverBase = await this.gs1ResolverBaseService.getResolverBase(
      saved.organizationId ?? "",
    );
    return {
      uuid: saved.uuid,
      referenceId: saved.referenceId,
      gtin: saved.gs1!.gtin,
      batch: saved.gs1!.batch ?? null,
      serial: saved.gs1!.serial ?? null,
      digitalLink: saved.buildDigitalLink(resolverBase),
    };
  }

  /**
   * Delete a single UPI, but only while the referenced passport is a draft.
   *
   * Read-only rows are rejected with 409: GTIN/EAN system rows. GS1 and internal
   * (OPEN_DPP_UUID) UPIs are deletable while the passport is a draft. Uses a single-id
   * delete that does NOT touch sibling UPIs. See ADR 0006.
   *
   * @throws NotFoundException when the UPI does not exist.
   * @throws ConflictException when the UPI is read-only (GTIN/EAN system row).
   * @throws ConflictException when the passport is published (lifecycle freeze).
   */
  async delete(uuid: string): Promise<void> {
    let upi: UniqueProductIdentifier;
    try {
      upi = await this.uniqueProductIdentifierRepository.findOneOrFail(uuid);
    } catch (error) {
      if (error instanceof NotFoundInDatabaseException) {
        throw new NotFoundException(`UniqueProductIdentifier ${uuid} not found`);
      }
      throw error;
    }

    // GTIN / EAN system rows are read-only (never user-managed). GS1 and internal
    // (OPEN_DPP_UUID) UPIs are deletable while the passport is a draft (ADR 0006).
    const isGs1 = upi.type === ExternalIdentifierType.GS1;
    const isInternal = upi.type === ExternalIdentifierType.OPEN_DPP_UUID;
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

    await this.uniqueProductIdentifierRepository.deleteById(uuid);
  }

  /**
   * List all UPIs for an organisation (GS1 + system), newest-first, with
   * cursor-based pagination.
   *
   * The incoming `pagination` (limit + cursor) is forwarded to the repository,
   * which runs the `_id`-based cursor query (UPI's primary key is `uuid`/`_id`,
   * not `id`). The repository's advanced cursor is surfaced as `cursor` on the
   * result (null on the last page).
   *
   * Batches the owning-passport lookup into a single `findByIds` call (no N+1).
   * `passportPublished` is derived from `passport.isPublished()` so the frontend
   * can lock rows when the passport is published.
   *
   * System (OPEN_DPP_UUID) rows have a null `digitalLink` regardless of the
   * resolver base.
   */
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

    // Collect distinct referenceIds and batch-load the owning passports.
    const distinctReferenceIds = [...new Set(upis.map((upi) => upi.referenceId))];
    const passportMap = await this.passportRepository.findByIds(distinctReferenceIds);

    const resolverBase = await this.gs1ResolverBaseService.getResolverBase(organizationId);

    const items = upis.map((upi) => {
      const passport = passportMap.get(upi.referenceId);
      const passportPublished = passport?.isPublished() ?? false;
      return upi.toListItem({ resolverBase, passportPublished });
    });
    return { items, cursor };
  }

  /**
   * List a single passport's UPIs (OPEN_DPP_UUID + GS1), newest-first, with
   * cursor-based pagination. The passport-scoped sibling of `list`.
   *
   * Because every row belongs to the same passport, the owning passport (for the
   * `passportPublished` flag) and its organisation (for the GS1 resolver-base
   * cascade) are resolved with a single `findOne` — no `findByIds` batch needed.
   * Returns early for an empty page so a passport with no UPIs avoids the extra
   * passport / resolver-base lookups.
   */
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
    const resolverBase = await this.gs1ResolverBaseService.getResolverBase(organizationId);

    const items = upis.map((upi) => upi.toListItem({ resolverBase, passportPublished }));
    return { items, cursor };
  }
}
