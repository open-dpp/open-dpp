import { Inject, Injectable } from "@nestjs/common";
import { ORGANIZATIONS_REPO, OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(ORGANIZATIONS_REPO) private organizationRepo: OrganizationsRepositoryPort,
  ) {
  }
}
