import { access } from "node:fs/promises";
import path from "node:path";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { OrganizationsService } from "../../identity/organizations/application/services/organizations.service";
import { Branding } from "../domain/branding";
import { BrandingFile } from "../domain/brandingFile";

@Injectable()
export class BrandingRepository {
  private readonly logger: Logger = new Logger(BrandingRepository.name);

  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly envService: EnvService,
  ) {
  }

  async findOneByOrganizationId(orgId: string): Promise<Branding> {
    const activeOrganization = await this.organizationsService.getOrganization(orgId);
    if (!activeOrganization) {
      throw new NotFoundException("User is not part of any organization");
    }

    return Branding.fromPlain({ logo: activeOrganization.logo ?? null });
  }

  async getInstanceBrandingPath(): Promise<BrandingFile> {
    let imagePath = path.resolve(__dirname, "../../../public/logo-with-text.svg");
    let responseType = "image/svg+xml";

    const brandingURL = this.envService.get("OPEN_DPP_INSTANCE_BRANDING");
    if (brandingURL && brandingURL.length > 0) {
      const candidatePath = path.isAbsolute(brandingURL)
        ? brandingURL
        : path.resolve(__dirname, "../../../", brandingURL);

      try {
        await access(candidatePath);
        imagePath = candidatePath;

        const extension = path.extname(candidatePath).toLowerCase();
        if (extension === ".png") {
          responseType = "image/png";
        }
        else if (extension === ".jpg" || extension === ".jpeg") {
          responseType = "image/jpeg";
        }
        else if (extension === ".webp") {
          responseType = "image/webp";
        }
        else if (extension === ".gif") {
          responseType = "image/gif";
        }
      }
      catch (error) {
        this.logger.warn("Failed to use custom branding image falling back to default: ", error);
      }
    }

    return {
      filetype: responseType,
      path: imagePath,
    };
  }
}
