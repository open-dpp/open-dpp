import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { Session } from "../../identity/auth/domain/session";
import { OrganizationsService } from "../../identity/organizations/application/services/organizations.service";
import { Branding } from "../domain/branding";

@Injectable()
export class BrandingRepository {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {
  }

  async findOneByActiveOrganizationId(session: Session): Promise<Branding> {
    const activeOrganizationId = session.activeOrganizationId;
    if (!activeOrganizationId) {
      throw new BadRequestException();
    }
    const activeOrganization = await this.organizationsService.getOrganization(activeOrganizationId, session);
    if (!activeOrganization) {
      throw new ForbiddenException("User is not part of any organization");
    }

    return Branding.fromPlain({ logo: activeOrganization.logo ?? null });
  }
}
