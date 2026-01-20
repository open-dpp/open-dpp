import { Logger } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Organization } from "../../domain/organization";
import { MembersRepositoryPort } from "../../domain/ports/members.repository.port";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";
import { GetMemberOrganizationsQuery } from "./get-member-organizations.query";

@QueryHandler(GetMemberOrganizationsQuery)
export class GetMemberOrganizationsHandler implements IQueryHandler<GetMemberOrganizationsQuery> {
  private readonly logger = new Logger(GetMemberOrganizationsHandler.name);

  constructor(
    private readonly membersRepository: MembersRepositoryPort,
    private readonly organizationsRepository: OrganizationsRepositoryPort,
  ) { }

  async execute(query: GetMemberOrganizationsQuery): Promise<Organization[]> {
    this.logger.log(`Getting organizations for user: ${query.userId}`);
    const members = await this.membersRepository.findByUserId(query.userId);
    this.logger.log(`Found ${members.length} memberships for user ${query.userId}`);

    if (members.length === 0) {
      return [];
    }

    const organizationIds = members.map(member => member.organizationId);
    this.logger.log(`Organization IDs: ${organizationIds.join(", ")}`);
    return this.organizationsRepository.findManyByIds(organizationIds);
  }
}
