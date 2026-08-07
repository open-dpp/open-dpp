import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import { Controller, Get, Param } from "@nestjs/common";
import { UniqueProductIdentifierPaginationDtoSchema } from "@open-dpp/dto";
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
 * Passport-scoped surface for the UPI collection.
 *
 * Lives in the UPI module (cohesion with the list-item assembly in
 * `UpiCollectionService`) but mounts under `/passports` because the resource is
 * addressed per passport. It is a separate controller from
 * `UniqueProductIdentifierController` because that controller's
 * `unique-product-identifiers` prefix cannot express the `/passports/:id/...`
 * path. The route is distinct from `PassportController`'s singular
 * `:id/unique-product-identifier`, so the two never collide.
 *
 * GET /passports/:id/unique-product-identifiers — list the passport's UPIs
 * (OPEN_DPP_UUID + GS1), newest-first, cursor-paginated (`?limit` + `?cursor`),
 * returning the standard `{ paging_metadata, result }` envelope. Ownership-gated
 * via `loadDigitalProductDocumentAndCheckOwnership`: 403 for a non-member /
 * cross-org caller, 404 for an unknown passport, 400 for a missing org header.
 */
@Controller("passports")
export class PassportUniqueProductIdentifierController {
  constructor(
    private readonly upiCollectionService: UpiCollectionService,
    private readonly passportService: PassportService,
  ) {}

  @Get(":id/unique-product-identifiers")
  async listByPassport(
    @OrganizationId() orgId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
  ) {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    // Verifies the passport exists (404) and that the caller belongs to its org
    // (403 cross-org / non-member).
    await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      orgId,
    );
    const pagination = Pagination.create({ limit, cursor });
    const { items, cursor: nextCursor } = await this.upiCollectionService.listByPassport(
      id,
      pagination,
    );
    return UniqueProductIdentifierPaginationDtoSchema.parse({
      paging_metadata: { cursor: nextCursor },
      result: items,
    });
  }
}
