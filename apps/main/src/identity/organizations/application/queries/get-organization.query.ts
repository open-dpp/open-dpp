import { Query } from "@nestjs/cqrs";
import { Organization } from "../../domain/organization";

export class GetOrganizationQuery extends Query<Organization | null> {
  constructor(
    public readonly organizationId: string,
    public readonly headers: Record<string, string>,
  ) {
    super();
  }
}
