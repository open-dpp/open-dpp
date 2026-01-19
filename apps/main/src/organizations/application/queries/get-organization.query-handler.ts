import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { GetOrganizationQuery } from "./get-organization.query";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";
import { Organization } from "../../domain/organization";

@QueryHandler(GetOrganizationQuery)
export class GetOrganizationQueryHandler implements IQueryHandler<GetOrganizationQuery> {
    constructor(
        private readonly organizationsRepository: OrganizationsRepositoryPort,
    ) { }

    async execute(query: GetOrganizationQuery): Promise<Organization | null> {
        return this.organizationsRepository.findOneById(query.organizationId);
    }
}
