import { Organization } from "../organization";

export abstract class OrganizationsRepositoryPort {
  abstract save(organization: Organization): Promise<void>;
  abstract findOneById(id: string): Promise<Organization | null>;
  abstract findOneBySlug(slug: string): Promise<Organization | null>;
  abstract findManyByIds(ids: string[]): Promise<Organization[]>;
  abstract findManyByMember(memberId: string): Promise<Organization[]>;
}
