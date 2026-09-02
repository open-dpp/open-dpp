import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { OrganizationsRepository } from "../../identity/organizations/infrastructure/adapters/organizations.repository";
import { PolicyService } from "./policy.service";

// Backfills organizations that predate a policy rule — either because they were
// created before the rule existed, or before policies were materialized at all.
@Injectable()
export class PolicyInitializerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PolicyInitializerService.name);

  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly policyService: PolicyService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const organizationIds = await this.organizationsRepository.findAllIds();
    let failed = 0;

    for (const organizationId of organizationIds) {
      try {
        await this.policyService.ensureDefaultPolicies(organizationId);
      } catch (error) {
        // A single unreachable organization must not take down the whole instance.
        failed++;
        this.logger.error(`Failed to ensure policies for organization ${organizationId}`, error);
      }
    }

    this.logger.log(
      `Ensured policies for ${organizationIds.length - failed} of ${organizationIds.length} organizations`,
    );
  }
}
