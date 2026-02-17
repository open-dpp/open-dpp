import { Injectable, Logger } from "@nestjs/common";
import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";
import { UserRole } from "../../../users/domain/user-role.enum";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { MemberWithUser } from "../../domain/member";
import { Organization } from "../../domain/organization";
import { MembersRepository } from "../../infrastructure/adapters/members.repository";
import { OrganizationsRepository } from "../../infrastructure/adapters/organizations.repository";

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly usersRepository: UsersRepository,
  ) { }

  async isMemberOfOrganization(userId: string, organizationId: string): Promise<boolean> {
    const member = await this.membersRepository.findOneByUserIdAndOrganizationId(userId, organizationId);
    return !!member;
  }

  async isOwnerOrAdmin(organizationId: string, userId: string): Promise<boolean> {
    const member = await this.membersRepository.findOneByUserIdAndOrganizationId(userId, organizationId);
    if (!member) {
      return false;
    }
    if (member.isOwner()) {
      return true;
    }
    const user = await this.usersRepository.findOneById(userId);
    return user !== null && user.role === UserRole.ADMIN;
  }

  async getMemberOrganizations(userId: string, headers: BetterAuthHeaders): Promise<Organization[]> {
    this.logger.debug(`Getting organizations for user: ${userId}`);
    // Using default repo (BetterAuth) as per original handler
    return this.organizationsRepository.findManyByMember(headers);
  }

  async getMembers(organizationId: string): Promise<MemberWithUser[]> {
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
}
