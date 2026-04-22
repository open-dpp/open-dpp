import type { Model as MongooseModel } from "mongoose";
import { access } from "node:fs/promises";
import path from "node:path";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { EnvService } from "@open-dpp/env";
import { OrganizationsService } from "../../identity/organizations/application/services/organizations.service";
import { Branding } from "../domain/branding";
import { BrandingFile } from "../domain/brandingFile";
import { BrandingDoc, BrandingDocVersion } from "./branding.schema";

@Injectable()
export class BrandingRepository {
  private readonly logger: Logger = new Logger(BrandingRepository.name);

  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly envService: EnvService,
    @InjectModel(BrandingDoc.name)
    private readonly BrandingDoc: MongooseModel<BrandingDoc>,
  ) {}

  async findOneByOrganizationId(organizationId: string): Promise<Branding> {
    const brandingDoc = await this.BrandingDoc.findOne({ organizationId });

    if (!brandingDoc) {
      const activeOrganization = await this.organizationsService.getOrganization(organizationId);
      if (!activeOrganization) {
        throw new NotFoundException("Organization not found");
      }

      return Branding.create({
        organizationId,
        logo: activeOrganization.logo || undefined,
      });
    }

    return Branding.fromDb(brandingDoc.toObject());
  }

  getDefaultBranding(): Branding {
    return Branding.getDefault();
  }

  async save(branding: Branding): Promise<Branding> {
    let brandingDoc = await this.BrandingDoc.findOne({ organizationId: branding.organizationId });
    let orgLogoFallback: string | undefined = undefined;
    if (!brandingDoc) {
      const activeOrganization = await this.organizationsService.getOrganization(
        branding.organizationId,
      );

      if (!activeOrganization) {
        throw new NotFoundException("Organization not found");
      }

      brandingDoc = new this.BrandingDoc({ _schemaVersion: BrandingDocVersion.v1_0_0 });

      if (activeOrganization.logo) {
        this.logger.debug("migrating old to new logo");
        orgLogoFallback = activeOrganization.logo;
      }
    }

    const plain = branding.toPlain();
    brandingDoc.set({
      ...plain,
      logo: plain.logo ?? orgLogoFallback,
    });

    return Branding.fromDb((await brandingDoc.save()).toObject());
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
        } else if (extension === ".jpg" || extension === ".jpeg") {
          responseType = "image/jpeg";
        } else if (extension === ".webp") {
          responseType = "image/webp";
        } else if (extension === ".gif") {
          responseType = "image/gif";
        }
      } catch (error) {
        this.logger.warn("Failed to use custom branding image falling back to default: ", error);
      }
    }

    return {
      filetype: responseType,
      path: imagePath,
    };
  }
}
