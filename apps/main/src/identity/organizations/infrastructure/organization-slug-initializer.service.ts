import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { OrganizationsRepository } from "./adapters/organizations.repository";

/**
 * Backfills `slug = id` for organizations created before #852 (mirrors
 * PolicyInitializerService). A failing backfill is logged and never blocks startup;
 * the next boot retries.
 */
@Injectable()
export class OrganizationSlugInitializerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OrganizationSlugInitializerService.name);

  constructor(private readonly organizationsRepository: OrganizationsRepository) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const aligned = await this.organizationsRepository.alignSlugsWithIds();
      this.logger.log(`Aligned the slug of ${aligned} organization(s) with their id`);
    } catch (error) {
      this.logger.error("Failed to align organization slugs with their ids", error);
    }
  }
}
