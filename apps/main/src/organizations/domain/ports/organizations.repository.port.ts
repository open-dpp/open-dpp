import { Organization } from "../organization";

export const ORGANIZATIONS_REPO = Symbol("ORGANIZATIONS_REPO");

export interface OrganizationsRepositoryPort {
  save: (organization: Organization) => Promise<Organization>;
}
