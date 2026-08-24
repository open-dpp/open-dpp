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
