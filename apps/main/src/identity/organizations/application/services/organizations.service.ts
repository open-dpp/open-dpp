import { ForbiddenException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../../../auth/application/services/auth.service";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { Organization, OrganizationDbProps } from "../../domain/organization";
import { OrganizationRole } from "../../domain/organization-role.enum";
import { MembersRepository } from "../../infrastructure/adapters/members.repository";
import { OrganizationsRepository } from "../../infrastructure/adapters/organizations.repository";
import { OrganizationMapper } from "../../infrastructure/mappers/organization.mapper";

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly authService: AuthService,
    private readonly usersRepository: UsersRepository,
  ) { }

  async isOwnerOrAdmin(organizationId: string, userId: string): Promise<boolean> {
    const member = await this.membersRepository.findOneByUserIdAndOrganizationId(userId, organizationId);
    if (!member) {
      return false;
    }
    return member.role === OrganizationRole.OWNER || member.role === OrganizationRole.ADMIN;
  }

  async createOrganization(
    userId: string,
    name: string,
    slug: string,
    headers: Record<string, string>,
    logo?: string,
    metadata?: any,
  ): Promise<Organization> {
    this.logger.log(`Creating organization ${name}`);
    const betterAuthOrganization = await (this.authService.auth.api as any).createOrganization({
      headers,
      body: {
        name,
        slug,
        logo,
        metadata: JSON.stringify(metadata || {}),
      },
    });
    return OrganizationMapper.toDomainFromBetterAuth(betterAuthOrganization);
  }

  async updateOrganization(
    headers: Record<string, string>,
    organizationId: string,
    name?: string,
    slug?: string,
    logo?: string,
    metadata?: any,
  ): Promise<void> {
    const organization = await this.organizationsRepository.findOneById(organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const updatedProps: OrganizationDbProps = {
      id: organization.id,
      name: name ?? organization.name,
      slug: slug ?? organization.slug,
      logo: logo !== undefined ? logo : organization.logo,
      metadata: metadata ?? organization.metadata,
      createdAt: organization.createdAt,
    };
    const updatedOrganization = Organization.loadFromDb(updatedProps);

    await this.organizationsRepository.save(updatedOrganization, headers);
  }

  async getMemberOrganizations(userId: string, headers: Record<string, string>): Promise<Organization[]> {
    this.logger.debug(`Getting organizations for user: ${userId}`);
    // Using default repo (BetterAuth) as per original handler
    return this.organizationsRepository.findManyByMember(headers);
  }

  async getOrganization(organizationId: string, headers: Record<string, string>): Promise<Organization | null> {
    const session = await this.authService.getSession(headers as any);
    if (!session) {
      throw new UnauthorizedException();
    }

    const isMember = await this.authService.isMemberOfOrganization(
      session.user.id,
      organizationId,
    );

    if (!isMember) {
      this.logger.warn(`User ${session.user.id} is not a member of organization ${organizationId}`);
      throw new ForbiddenException();
    }

    return this.organizationsRepository.findOneById(organizationId);
  }

  async getMembers(organizationId: string): Promise<any[]> {
    const members = await this.membersRepository.findByOrganizationId(organizationId);
    if (members.length === 0) {
      return [];
    }

    const userIds = members.map(member => member.userId);
    const users = await this.usersRepository.findAllByIds(userIds);
    const userMap = new Map(users.map(user => [user.id, user]));

    return members.map(member => ({
      ...member,
      user: userMap.get(member.userId)
        ? {
            id: userMap.get(member.userId)!.id,
            email: userMap.get(member.userId)!.email,
            name: userMap.get(member.userId)!.name,
            image: userMap.get(member.userId)!.image,
          }
        : null,
    }));
  }

  async inviteMember(
    email: string,
    role: string,
    organizationId: string,
    headers?: Record<string, string> | Headers,
  ): Promise<void> {
    if (!this.authService.auth) {
      throw new Error("Auth service is not initialized");
    }

    const api = this.authService.auth.api as any;

    if (typeof api.createInvitation !== "function") {
      throw new TypeError("createInvitation method is not available on auth api. Check if organization plugin is enabled.");
    }

    await api.createInvitation({
      headers,
      body: {
        email,
        role,
        organizationId,
      },
    });
  }
}
