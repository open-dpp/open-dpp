import { Injectable } from "@nestjs/common";
import { OrganizationRole } from "../../domain/organization-role.enum";
import { MembersRepositoryPort } from "../../domain/ports/members.repository.port";

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly membersRepository: MembersRepositoryPort,
  ) { }

  async isOwnerOrAdmin(organizationId: string, userId: string): Promise<boolean> {
    const member = await this.membersRepository.findOneByUserIdAndOrganizationId(userId, organizationId);
    if (!member) {
      return false;
    }
    return member.role === OrganizationRole.OWNER || member.role === OrganizationRole.ADMIN;
  }
}
