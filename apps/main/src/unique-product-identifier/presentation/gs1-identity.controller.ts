import type { Gs1IdentityResponse } from "@open-dpp/dto";
import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import { PassportService } from "../../passports/application/services/passport.service";
import { Gs1IdentityService } from "../application/services/gs1-identity.service";

/**
 * Backoffice surface (under the `/api` prefix) for a passport's GS1 identity —
 * **read-only** as of Slice 44.
 *
 * **Authorization:** an org member with passport-view rights.
 *
 * **GET `/passports/:id/gs1-identity`** returns the MOST-RECENTLY-CREATED GS1
 * UPI for the passport, 404 when the passport has no GS1 UPI.  This is a
 * deliberate backward-compatibility convenience for legacy 1:1 callers; the
 * authoritative many-per-passport surface is the UPI collection
 * (`GET /unique-product-identifiers`, Slices 41/43).
 *
 * **Write surface retired.** The `PUT` and `DELETE` endpoints that used to live
 * here have been removed (Slice 44).  GS1 UPI creation, mutation and deletion
 * are now handled entirely by the UPI collection API.
 */
@Controller("/passports")
export class Gs1IdentityController {
  constructor(
    private readonly gs1IdentityService: Gs1IdentityService,
    private readonly passportService: PassportService,
  ) {}

  @Get(":id/gs1-identity")
  async getGs1Identity(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<Gs1IdentityResponse> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const identity = await this.gs1IdentityService.getIdentity(id, organizationId);
    if (!identity) {
      throw new NotFoundException(`No GS1 identity found for passport ${id}`);
    }
    return identity;
  }
}
