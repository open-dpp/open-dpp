import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Organization } from "../../domain/organization";
import { MembersRepositoryPort } from "../../domain/ports/members.repository.port";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";
import { GetMemberOrganizationsQuery } from "./get-member-organizations.query";

@QueryHandler(GetMemberOrganizationsQuery)
export class GetMemberOrganizationsHandler implements IQueryHandler<GetMemberOrganizationsQuery> {
    constructor(
        private readonly membersRepository: MembersRepositoryPort,
        private readonly organizationsRepository: OrganizationsRepositoryPort,
    ) { }

    async execute(query: GetMemberOrganizationsQuery): Promise<Organization[]> {
        const members = await this.membersRepository.findByUserId(query.userId);

        if (members.length === 0) {
            return [];
        }

        const organizationIds = members.map((member) => member.organizationId);
        return this.organizationsRepository.findManyByIds(organizationIds);
    }
}
