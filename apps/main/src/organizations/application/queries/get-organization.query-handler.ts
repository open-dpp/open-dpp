import { ForbiddenException, Inject, Logger, UnauthorizedException } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { AuthService } from "../../../auth/auth.service";
import { Organization } from "../../domain/organization";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";
import { ORGANIZATIONS_REPO_MONGO } from "../../organizations.constants";
import { GetOrganizationQuery } from "./get-organization.query";

@QueryHandler(GetOrganizationQuery)
export class GetOrganizationQueryHandler implements IQueryHandler<GetOrganizationQuery> {
  private readonly logger = new Logger(GetOrganizationQueryHandler.name);

  constructor(
    @Inject(ORGANIZATIONS_REPO_MONGO)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    private readonly authService: AuthService,
  ) { }

  async execute(query: GetOrganizationQuery): Promise<Organization | null> {
    const session = await this.authService.getSession(query.headers as any);
    if (!session) {
      throw new UnauthorizedException();
    }

    const isMember = await this.authService.isMemberOfOrganization(
      session.user.id,
      query.organizationId,
    );

    if (!isMember) {
      this.logger.warn(`User ${session.user.id} is not a member of organization ${query.organizationId}`);
      throw new ForbiddenException();
    }

    return this.organizationsRepository.findOneById(query.organizationId);
  }
}
