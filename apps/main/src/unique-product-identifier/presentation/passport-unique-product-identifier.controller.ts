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
