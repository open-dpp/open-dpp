import type {
  CreateGs1UniqueProductIdentifierRequest,
  CreateInternalUniqueProductIdentifierRequest,
  UpdateGs1UniqueProductIdentifierRequest,
} from "@open-dpp/dto";
import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import {
  CreateGs1UniqueProductIdentifierRequestSchema,
  CreateInternalUniqueProductIdentifierRequestSchema,
  UniqueProductIdentifierPaginationDtoSchema,
  UpdateGs1UniqueProductIdentifierRequestSchema,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { CursorQueryParam } from "../../aas/presentation/aas.decorators";
import { LimitQueryParam } from "../../digital-product-document/presentation/digital-product-document-decorators";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import { Pagination } from "../../pagination/pagination";
import { PassportService } from "../../passports/application/services/passport.service";
import { UpiCollectionService } from "../application/services/upi-collection.service";

/**
 * Backoffice surface for the org-scoped UPI collection.
 *
 * Authorization: an org member (any role). Non-members receive 403. A missing
 * org header is rejected with 400 by the `@OrganizationId()` decorator.
 *
 * GET /unique-product-identifiers — list UPIs (OPEN_DPP_UUID + GS1) that belong
 * to the requesting organisation, newest-first, with cursor-based pagination
 * (`?limit` + `?cursor`). Returns the standard `{ paging_metadata, result }`
 * envelope.
 *
 * POST /unique-product-identifiers — create a new GS1 UPI for a DRAFT passport.
 * Ownership of the passport is verified (403 if not a member of the owning org).
 * The passport must be a draft (409 if published). A duplicate full GS1 key
 * surfaces as 409. An invalid GTIN check digit surfaces as 400 (via ZodValidationPipe).
 *
 * POST /unique-product-identifiers/internal — create a new internal (OPEN_DPP_UUID)
 * UPI for a DRAFT passport (the server mints its uuid; no identity payload).
 * Ownership verified (403); 409 if the passport is published. A user-created
 * internal UPI is never the passport's canonical row. See ADR 0005.
 *
 * GET /unique-product-identifiers/:id — fetch a single UPI by its uuid. Ownership
 * is verified via the UPI's owning passport (403 cross-org). 404 for unknown id.
 *
 * PATCH /unique-product-identifiers/:id — update the GS1 identity of an existing
 * GS1 UPI while the referenced passport is a draft (409 if published, or if the
 * row is not GS1 — internal identifiers carry no editable data). A duplicate
 * resulting key surfaces as 409.
 *
 * DELETE /unique-product-identifiers/:id — delete a single UPI while the referenced
 * passport is a draft (409 if published, or if the row is read-only: the canonical
 * internal UPI or a GTIN/EAN system row). Returns 204 on success.
 */
@Controller("unique-product-identifiers")
export class UniqueProductIdentifierController {
  constructor(
    private readonly upiCollectionService: UpiCollectionService,
    private readonly passportService: PassportService,
  ) {}

  @Get()
  async list(
    @OrganizationId() orgId: string,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
  ) {
    if (memberRole === undefined) {
      throw new ForbiddenException();
    }
    const pagination = Pagination.create({ limit, cursor });
    const { items, cursor: nextCursor } = await this.upiCollectionService.list(orgId, pagination);
    return UniqueProductIdentifierPaginationDtoSchema.parse({
      paging_metadata: { cursor: nextCursor },
      result: items,
    });
  }

  @Get(":id")
  async getById(
    @OrganizationId() orgId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ) {
    // Load the UPI (→ 404 if not found).
    const upi = await this.upiCollectionService.get(id);
    // Derive the owning passport and verify org membership (→ 403 cross-org).
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
      upi.referenceId,
      subject,
      orgId,
    );
    return upi;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @OrganizationId() orgId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @Body(new ZodValidationPipe(CreateGs1UniqueProductIdentifierRequestSchema))
    body: CreateGs1UniqueProductIdentifierRequest,
  ) {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    // Verifies passport ownership and org membership (throws 403 if not a member
    // or if the passport belongs to a different org).
    const passport =
      await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        body.referenceId,
        subject,
        orgId,
      );

    if (!passport.isDraft()) {
      throw new ConflictException(
        "A GS1 UPI can only be created while the passport is a draft; it is locked once the passport is published",
      );
    }

    return this.upiCollectionService.create({
      referenceId: body.referenceId,
      gtin: body.gtin,
      batch: body.batch,
      serial: body.serial,
      organizationId: orgId,
    });
  }

  @Post("internal")
  @HttpCode(HttpStatus.CREATED)
  async createInternal(
    @OrganizationId() orgId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @Body(new ZodValidationPipe(CreateInternalUniqueProductIdentifierRequestSchema))
    body: CreateInternalUniqueProductIdentifierRequest,
  ) {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    // Verifies passport ownership and org membership (403 if not a member or if the
    // passport belongs to a different org). The draft gate lives in the service.
    await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
      body.referenceId,
      subject,
      orgId,
    );

    return this.upiCollectionService.createInternal({
      referenceId: body.referenceId,
      organizationId: orgId,
    });
  }

  @Patch(":id")
  async update(
    @OrganizationId() orgId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @Body(new ZodValidationPipe(UpdateGs1UniqueProductIdentifierRequestSchema))
    body: UpdateGs1UniqueProductIdentifierRequest,
  ) {
    // Resolve ownership: load the UPI to get its referenceId, then check passport
    // membership. The draft gate and read-only system-row check live in the service.
    const upiSnapshot = await this.upiCollectionService.get(id);
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
      upiSnapshot.referenceId,
      subject,
      orgId,
    );
    // Delegate to the service — throws ConflictException (409) for published
    // passport or system row, throws NotFoundException (404) for unknown id.
    return this.upiCollectionService.update(id, body);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteById(
    @OrganizationId() orgId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ) {
    // Resolve ownership: load the UPI to get its referenceId, then check passport
    // membership. The draft gate and read-only system-row check live in the service.
    const upiSnapshot = await this.upiCollectionService.get(id);
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
      upiSnapshot.referenceId,
      subject,
      orgId,
    );
    // Delegate to the service — throws ConflictException (409) for published
    // passport or system row, throws NotFoundException (404) for unknown id.
    await this.upiCollectionService.delete(id);
  }
}
