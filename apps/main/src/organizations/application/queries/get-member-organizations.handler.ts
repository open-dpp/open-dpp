import { Inject, Logger } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Organization } from "../../domain/organization";
import { MembersRepositoryPort } from "../../domain/ports/members.repository.port";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";

import { ORGANIZATIONS_REPO_BETTER_AUTH } from "../../organizations.constants";
import { GetMemberOrganizationsQuery } from "./get-member-organizations.query";

@QueryHandler(GetMemberOrganizationsQuery)
export class GetMemberOrganizationsHandler implements IQueryHandler<GetMemberOrganizationsQuery> {
  private readonly logger = new Logger(GetMemberOrganizationsHandler.name);

  constructor(
    private readonly membersRepository: MembersRepositoryPort,
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(ORGANIZATIONS_REPO_BETTER_AUTH)
    private readonly betterAuthOrganizationsRepository: OrganizationsRepositoryPort,
  ) { }

  async execute(query: GetMemberOrganizationsQuery): Promise<Organization[]> {
    this.logger.debug(`Getting organizations for user: ${query.userId}`);
    return this.getMemberOrganizationsWithBetterAuth(query);
  }

  async getMemberOrganizationsWithBetterAuth(query: GetMemberOrganizationsQuery): Promise<Organization[]> {
    return this.betterAuthOrganizationsRepository.findManyByMember(query.headers);
  }

  async getMemberOrganizations(query: GetMemberOrganizationsQuery): Promise<Organization[]> {
    const members = await this.membersRepository.findByUserId(query.userId);
    this.logger.debug(`Found ${members.length} memberships for user ${query.userId}`);

    if (members.length === 0) {
      return [];
    }

    const organizationIds = members.map(member => member.organizationId);
    this.logger.debug(`Organization IDs: ${organizationIds.join(", ")}`);
    return this.organizationsRepository.findManyByIds(organizationIds);
  }
}
