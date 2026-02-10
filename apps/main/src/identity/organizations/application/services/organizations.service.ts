import { BadRequestException, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { Session } from "../../../auth/domain/session";
import { UserRole } from "../../../users/domain/user-role.enum";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { Member } from "../../domain/member";
import { MemberRole } from "../../domain/member-role.enum";
import { Organization, OrganizationCreateProps, OrganizationUpdateProps } from "../../domain/organization";
import { InvitationsRepository } from "../../infrastructure/adapters/invitations.repository";
import { MembersRepository } from "../../infrastructure/adapters/members.repository";
import { OrganizationsRepository } from "../../infrastructure/adapters/organizations.repository";
import { OrganizationMapper } from "../../infrastructure/mappers/organization.mapper";

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly invitationsRepository: InvitationsRepository,
  ) { }

  async isOwnerOrAdmin(organizationId: string, userId: string): Promise<boolean> {
    const member = await this.membersRepository.findOneByUserIdAndOrganizationId(userId, organizationId);
    if (!member) {
      return false;
    }
    if (member.role === MemberRole.OWNER) {
      return true;
    }
    const user = await this.usersRepository.findOneById(userId);
    return user !== null && user.role === UserRole.ADMIN;
  }

  async createOrganization(
    data: OrganizationCreateProps,
    session: Session,
    headers: Record<string, string>,
  ): Promise<Organization> {
    const existsWithSlug = await this.organizationsRepository.findOneBySlug(data.slug);
    if (existsWithSlug) {
      throw new BadRequestException();
    }
    const organization = Organization.create(data);
    const betterAuthOrganization = await this.organizationsRepository.create(organization, headers);
    if (!betterAuthOrganization) {
      throw new BadRequestException();
    }
    const createdOrganization = OrganizationMapper.toDomainFromBetterAuth(betterAuthOrganization);
    const owner = Member.create({
      userId: session.userId,
      organizationId: createdOrganization.id,
      role: MemberRole.OWNER,
    });
    createdOrganization.addMember(owner);
    return createdOrganization;
  }

  async updateOrganization(
    organizationId: string,
    data: OrganizationUpdateProps,
    session: Session,
    headers: Record<string, string>,
  ): Promise<Organization | null> {
    const organization = await this.organizationsRepository.findOneById(organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const isOwnerOrAdmin = await this.isOwnerOrAdmin(organizationId, session.userId);
    if (!isOwnerOrAdmin) {
      throw new ForbiddenException("You are not authorized to update this organization");
    }

    return await this.organizationsRepository.update(organizationId, data, headers);
  }

  async getMemberOrganizations(userId: string, headers: Record<string, string>): Promise<Organization[]> {
    this.logger.debug(`Getting organizations for user: ${userId}`);
    // Using default repo (BetterAuth) as per original handler
    return this.organizationsRepository.findManyByMember(headers);
  }

  async getOrganization(
    organizationId: string,
    session: Session,
  ): Promise<Organization | null> {
    const member = await this.membersRepository.findOneByUserIdAndOrganizationId(session.userId, organizationId);

    if (!member) {
      this.logger.warn(`User ${session.userId} is not a member of organization ${organizationId}`);
      throw new ForbiddenException();
    }

    return this.organizationsRepository.findOneById(organizationId);
  }

  async inviteMember(
    email: string,
    role: string,
    organizationId: string,
    headers?: Record<string, string> | Headers,
  ): Promise<void> {
    await this.organizationsRepository.inviteMember(email, role, organizationId, headers);
  }

  async getOrganizationNameIfUserInvited(organizationId: string, session: Session): Promise<string | null> {
    const user = await this.usersRepository.findOneById(session.userId);
    if (!user) {
      return null;
    }
    const invitation = await this.invitationsRepository.findOneUnexpiredByEmailAndOrganization(user.email, organizationId);
    if (!invitation) {
      return null;
    }
    const organization = await this.organizationsRepository.findOneById(invitation.organizationId);
    if (!organization) {
      return null;
    }
    return organization.name;
  }

  async getAllOrganizations(session: Session) {
    const user = await this.usersRepository.findOneById(session.userId);
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException();
    }
    return this.organizationsRepository.getAllOrganizations();
  }

  // ! only used for organisation data in passports
  async getOrganizationDataForPermalink(
    organizationId: string,
  ): Promise<Organization | null> {
    return this.organizationsRepository.findOneById(organizationId);
  }
}
