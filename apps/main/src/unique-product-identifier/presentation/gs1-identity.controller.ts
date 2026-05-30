import type { Gs1IdentityRequest, Gs1IdentityResponse } from "@open-dpp/dto";
import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
} from "@nestjs/common";
import type { Passport } from "../../passports/domain/passport";
import { Gs1IdentityRequestSchema } from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import { isDuplicateKeyError } from "../../lib/mongo-errors";
import { PassportService } from "../../passports/application/services/passport.service";
import { Gs1IdentityService } from "../application/services/gs1-identity.service";

/**
 * Backoffice surface (under the `/api` prefix) for a passport's GS1 identity.
 *
 * Authorization: an org member with passport-edit rights.
 *
 * Lifecycle: a GS1 identity is editable (create / update / remove) only while the
 * passport is a **draft**. Once **published** the identity is frozen — immutable
 * and non-removable — mirroring the permalink publish-freeze; any write to a
 * published passport is rejected with a 409 conflict. A duplicate full key also
 * surfaces as a 409 conflict.
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

  @Put(":id/gs1-identity")
  async setGs1Identity(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @Body(new ZodValidationPipe(Gs1IdentityRequestSchema)) body: Gs1IdentityRequest,
  ): Promise<Gs1IdentityResponse> {
    await this.loadDraftPassportForWrite(id, organizationId, userRole, memberRole);
    try {
      return await this.gs1IdentityService.setIdentity(
        id,
        {
          gtin: body.gtin,
          batch: body.batch,
          serial: body.serial,
        },
        organizationId,
      );
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(
          "This GS1 identity (GTIN, batch and serial) is already assigned to another passport",
        );
      }
      throw error;
    }
  }

  @Delete(":id/gs1-identity")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeGs1Identity(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<void> {
    await this.loadDraftPassportForWrite(id, organizationId, userRole, memberRole);
    const identity = await this.gs1IdentityService.getIdentity(id, organizationId);
    if (!identity) {
      throw new NotFoundException(`No GS1 identity found for passport ${id}`);
    }
    await this.gs1IdentityService.removeIdentity(id);
  }

  /**
   * Load a passport for a GS1 identity write, enforcing ownership and the
   * draft-only lifecycle gate in one place.
   *
   * Ownership failure → 403 (from the loader). A published (frozen) passport →
   * 409, mirroring the permalink publish-freeze: the identity is locked once the
   * passport is published.
   */
  private async loadDraftPassportForWrite(
    id: string,
    organizationId: string,
    userRole: UserRoleType,
    memberRole: MemberRoleType | undefined,
  ): Promise<Passport> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport =
      await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    if (!passport.isDraft()) {
      throw new ConflictException(
        "The GS1 identity is frozen once the passport is published; it can only be changed while the passport is a draft",
      );
    }
    return passport;
  }
}
