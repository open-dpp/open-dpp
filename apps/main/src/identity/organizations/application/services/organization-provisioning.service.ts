import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import type { OrganizationOwnerDto } from "@open-dpp/dto";
import { PolicyManagementService } from "../../../../policy/application/services/policy-management.service";
import { User } from "../../../users/domain/user";
import { UserRole } from "../../../users/domain/user-role.enum";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { Organization } from "../../domain/organization";
import { MembersRepository } from "../../infrastructure/adapters/members.repository";
import { OrganizationsRepository } from "../../infrastructure/adapters/organizations.repository";
import { ProvisioningMailer } from "../../infrastructure/provisioning-mailer";

export interface ProvisionOrganizationCommand {
  name: string;
  owner: OrganizationOwnerDto;
  /** Instance admin on whose behalf the organization is provisioned; for the audit log only. */
  adminUserId: string;
}

export interface ProvisionedOwner {
  id: string;
  email: string;
  /** `true` when this call created the user, `false` when it already existed. */
  created: boolean;
}

export interface ProvisioningResult {
  organization: Organization;
  owner: ProvisionedOwner;
  emailSent: boolean;
}

interface ResolvedOwner {
  user: User;
  created: boolean;
}

/**
 * Creates an organization together with its owner in one call (#853): the owner is
 * looked up by email or created, the organization is created with that user as its
 * only member, and the owner is notified. User and organization creation are
 * all-or-nothing by compensation: a user created here is removed again when the
 * organization cannot be created. Mail problems never fail the request.
 */
@Injectable()
export class OrganizationProvisioningService {
  private readonly logger = new Logger(OrganizationProvisioningService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly membersRepository: MembersRepository,
    private readonly policyManagementService: PolicyManagementService,
    private readonly provisioningMailer: ProvisioningMailer,
  ) {}

  async provision(command: ProvisionOrganizationCommand): Promise<ProvisioningResult> {
    const { user, created } = await this.findOrCreateOwner(command.owner);
    const organization = await this.createOrganizationOrRollback(command.name, user, created);
    await this.seedDefaultPolicies(organization.id);
    const language = created ? command.owner.locale : user.preferredLanguage;
    const emailSent = await this.provisioningMailer.notifyOwner({ user, organization, language });
    this.logger.log(
      `Provisioned organization ${organization.id} for owner ${user.id} ` +
        `(created: ${created}, mails sent: ${emailSent}) on behalf of admin ${command.adminUserId}`,
    );
    return { organization, owner: { id: user.id, email: user.email, created }, emailSent };
  }

  private async findOrCreateOwner(owner: OrganizationOwnerDto): Promise<ResolvedOwner> {
    const email = owner.email.toLowerCase();
    const existing = await this.usersRepository.findOneByEmail(email);
    if (existing) {
      return { user: existing, created: false };
    }
    const saved = await this.usersRepository.save(
      User.create({
        email,
        firstName: owner.firstName ?? "",
        lastName: owner.lastName ?? "",
        role: UserRole.USER,
        preferredLanguage: owner.locale,
      }),
    );
    if (saved) {
      return { user: saved, created: true };
    }
    // A concurrent call for the same email may have created the user first.
    const raced = await this.usersRepository.findOneByEmail(email);
    if (raced) {
      return { user: raced, created: false };
    }
    throw new InternalServerErrorException("The owner could not be created");
  }

  private async createOrganizationOrRollback(
    name: string,
    user: User,
    created: boolean,
  ): Promise<Organization> {
    try {
      const organization = await this.organizationsRepository.createForUser(
        Organization.create({ name, metadata: {} }),
        user.id,
      );
      if (organization) {
        return organization;
      }
      throw new Error("better-auth returned no organization");
    } catch (error) {
      this.logger.error(`Failed to create the organization for owner ${user.id}`, error);
      if (created) {
        await this.rollbackOwner(user.id);
      }
      throw new InternalServerErrorException("The organization could not be created");
    }
  }

  /**
   * Compensation for the user this call created. A concurrent call for the same email may
   * have found that user as "existing" (see findOrCreateOwner) and made it the owner of its
   * own organization in the meantime; deleting it then would orphan that membership. So the
   * user is only removed while no organization has adopted it.
   */
  private async rollbackOwner(userId: string): Promise<void> {
    try {
      const memberships = await this.membersRepository.findByUserId(userId);
      if (memberships.length > 0) {
        this.logger.warn(
          `Rollback skipped: user ${userId} was created by this call but is already a member ` +
            `of ${memberships.length} organization(s); keeping it`,
        );
        return;
      }
      await this.usersRepository.rollbackCreatedUser(userId);
    } catch (error) {
      this.logger.error(
        `Rollback failed: user ${userId} was created but its organization was not; remove the user manually`,
        error,
      );
    }
  }

  private async seedDefaultPolicies(organizationId: string): Promise<void> {
    try {
      await this.policyManagementService.ensureDefaultPolicies(organizationId);
    } catch (error) {
      this.logger.error(
        `Failed to seed default policies for organization ${organizationId}; ` +
          "it will be backfilled on next application bootstrap",
        error,
      );
    }
  }
}
