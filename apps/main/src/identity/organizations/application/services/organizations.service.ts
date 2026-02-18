import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";
import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Session } from "../../../auth/domain/session";
import { UserRole } from "../../../users/domain/user-role.enum";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { Member } from "../../domain/member";
import { MemberRole } from "../../domain/member-role.enum";
import { Organization, OrganizationCreateProps, OrganizationUpdateProps } from "../../domain/organization";
import { InvitationsRepository } from "../../infrastructure/adapters/invitations.repository";
import { MembersRepository } from "../../infrastructure/adapters/members.repository";
import { OrganizationsRepository } from "../../infrastructure/adapters/organizations.repository";

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly invitationsRepository: InvitationsRepository,
  ) { }

  async createOrganization(
    data: OrganizationCreateProps,
    session: Session,
    headers: BetterAuthHeaders,
  ): Promise<Organization> {
    const existsWithSlug = await this.organizationsRepository.findOneBySlug(data.slug);
    if (existsWithSlug) {
      throw new BadRequestException();
    }
    const organization = Organization.create(data);
    const createdOrganization = await this.organizationsRepository.create(organization, headers);
    if (!createdOrganization) {
      throw new BadRequestException();
    }
    const owner = Member.create({
      userId: session.userId,
      organizationId: createdOrganization.id,
      role: MemberRole.OWNER,
    });
    const organizationWithOwner = createdOrganization.addMember(owner);
    await this.membersRepository.save(owner);
    return organizationWithOwner;
  }

  async updateOrganization(
    organizationId: string,
    data: OrganizationUpdateProps,
    session: Session,
    headers: BetterAuthHeaders,
  ): Promise<Organization> {
    const member = await this.membersRepository.findOneByUserIdAndOrganizationId(session.userId, organizationId);
    if (!member?.isOwner()) {
      const user = await this.usersRepository.findOneById(session.userId);
      if (user?.role !== UserRole.ADMIN) {
        throw new ForbiddenException("You are not authorized to update this organization");
      }
    }

    const organization = await this.organizationsRepository.findOneById(organizationId);
    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    const updatedOrganization = organization.update(data);
    const result = await this.organizationsRepository.update(updatedOrganization, headers);
    if (!result) {
      throw new BadRequestException();
    }
    return result;
  }

  async getMemberOrganizations(userId: string, headers: BetterAuthHeaders): Promise<Organization[]> {
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
    session: Session,
    headers?: BetterAuthHeaders,
  ): Promise<void> {
    const member = await this.membersRepository.findOneByUserIdAndOrganizationId(session.userId, organizationId);
    if (!member?.isOwner()) {
      const user = await this.usersRepository.findOneById(session.userId);
      if (user?.role !== UserRole.ADMIN) {
        throw new ForbiddenException("You are not authorized to invite members to this organization");
      }
    }

    if (!Object.values(MemberRole).includes(role as MemberRole)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    const organization = await this.organizationsRepository.findOneById(organizationId);
    if (!organization) {
      throw new NotFoundException("Organization not found");
    }
    const invitation = organization.inviteMember(email, session.userId, role as MemberRole);
    await this.invitationsRepository.save(invitation, headers);
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
    if (user?.role !== UserRole.ADMIN) {
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
